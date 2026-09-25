package com.verona.store.ordering.application;

import com.verona.store.identity.User;
import com.verona.store.identity.UserRepository;
import com.verona.store.ordering.api.OrderDtos.OrderSummary;
import com.verona.store.ordering.api.OrderDtos.OrderView;
import com.verona.store.ordering.api.OrderDtos.PlaceOrderRequest;
import com.verona.store.ordering.application.CheckoutService.PricedCart;
import com.verona.store.ordering.application.CheckoutService.PricedLine;
import com.verona.store.ordering.domain.Order;
import com.verona.store.ordering.domain.OrderItem;
import com.verona.store.ordering.domain.OrderRepository;
import com.verona.store.ordering.domain.OrderStatus;
import com.verona.store.ordering.domain.OrderStatusChanged;
import com.verona.store.ordering.domain.PaymentMethod;
import com.verona.store.payments.PaymentService;
import com.verona.store.settings.StoreSettingsService;
import com.verona.store.config.AppProperties;
import org.springframework.context.ApplicationEventPublisher;
import com.verona.store.ordering.inventory.InventoryRepository;
import com.verona.store.shared.exception.BusinessException;
import com.verona.store.shared.exception.NotFoundException;
import com.verona.store.shared.web.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Comparator;

/**
 * Customer-side order use cases. Placing an order is one transaction: re-price, reserve stock
 * atomically per variant, snapshot, persist. Any failure rolls every reservation back.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orders;
    private final UserRepository users;
    private final InventoryRepository inventory;
    private final CheckoutService checkout;
    private final PaymentService payments;
    private final StoreSettingsService settings;
    private final ApplicationEventPublisher events;
    private final AppProperties properties;

    @Transactional
    public OrderView place(Long userId, PlaceOrderRequest request) {
        // Idempotency: a retried submit (double click, network retry) returns the order already created.
        var existing = orders.findByUserIdAndIdempotencyKey(userId, request.idempotencyKey());
        if (existing.isPresent()) {
            return OrderViews.forCustomer(existing.get());
        }

        User customer = users.findById(userId).filter(User::isEnabled)
                .orElseThrow(() -> new BusinessException("ACCOUNT_DISABLED", "This account has been disabled", HttpStatus.FORBIDDEN));
        if (!settings.availablePaymentMethods().contains(request.paymentMethod())) {
            throw new BusinessException("PAYMENT_METHOD_UNAVAILABLE", "This payment method is not available",
                    HttpStatus.BAD_REQUEST);
        }
        boolean payOnline = request.paymentMethod() == PaymentMethod.CARD;

        PricedCart cart = checkout.price(request.items(), request.address().governorate());
        if (!cart.quote().orderable()) {
            throw new BusinessException("CART_CHANGED",
                    "Some items are no longer available in the requested quantity; review your bag");
        }

        // Fixed lock order (by variant id) so concurrent checkouts touching the same variants cannot deadlock.
        cart.lines().stream()
                .sorted(Comparator.comparing(l -> l.variant().getId()))
                .forEach(l -> {
                    if (inventory.reserve(l.variant().getId(), l.view().quantity()) == 0) {
                        throw new BusinessException("CART_CHANGED",
                                "Stock ran out for " + l.variant().getSku() + " while placing the order");
                    }
                });

        Order order = new Order();
        order.setOrderNumber("VR-" + orders.nextOrderNumber());
        order.setUser(customer);
        order.setIdempotencyKey(request.idempotencyKey());
        order.setPaymentMethod(request.paymentMethod());
        order.setSubtotal(cart.quote().subtotal());
        order.setShippingFee(cart.quote().shippingFee());
        order.setTotal(cart.quote().total());

        var address = request.address();
        order.setRecipientName(address.recipientName().trim());
        order.setPhone(address.phone());
        order.setGovernorate(address.governorate());
        order.setCity(address.city().trim());
        order.setStreet(address.street().trim());
        order.setBuilding(StringUtils.hasText(address.building()) ? address.building().trim() : null);
        order.setNotes(StringUtils.hasText(request.notes()) ? request.notes().trim() : null);

        cart.lines().forEach(line -> order.addItem(snapshot(line)));
        if (payOnline) {
            // Stock stays reserved while the shopper pays; the expiry job releases it if they never do.
            order.setPaymentExpiresAt(Instant.now().plus(properties.payments().paymentWindow()));
        }
        order.open(payOnline ? OrderStatus.PENDING_PAYMENT : OrderStatus.PENDING, customer);

        Order saved = orders.save(order);
        log.info("Order {} placed by user {} ({} lines, total {}, {})", saved.getOrderNumber(), userId,
                saved.getItems().size(), saved.getTotal(), saved.getPaymentMethod());
        if (payOnline) {
            // Inside the same transaction: if the gateway cannot open a session, the order and its
            // stock reservation roll back instead of leaving an order nobody can pay.
            return OrderViews.forCustomer(saved, payments.start(saved, customer));
        }
        events.publishEvent(new OrderStatusChanged(saved.getId(), OrderStatus.PENDING));
        return OrderViews.forCustomer(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummary> mine(Long userId, Pageable pageable) {
        return PageResponse.of(orders.findAllByUserId(userId, pageable), OrderViews::summary);
    }

    @Transactional(readOnly = true)
    public OrderView mine(Long userId, String orderNumber) {
        return OrderViews.forCustomer(findOwned(userId, orderNumber));
    }

    @Transactional
    public OrderView cancel(Long userId, String orderNumber) {
        Order order = findOwned(userId, orderNumber);
        if (!order.getStatus().customerCancellable()) {
            throw new BusinessException("ORDER_NOT_CANCELLABLE", "This order can no longer be cancelled");
        }
        OrderFulfilment.cancel(order, "Cancelled by customer", users.getReferenceById(userId), inventory);
        events.publishEvent(new OrderStatusChanged(order.getId(), OrderStatus.CANCELLED));
        return OrderViews.forCustomer(order);
    }

    private Order findOwned(Long userId, String orderNumber) {
        // Another customer's order number yields 404, never 403, so numbers cannot be probed.
        return orders.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new NotFoundException("Order", orderNumber));
    }

    private static OrderItem snapshot(PricedLine line) {
        var view = line.view();
        OrderItem item = new OrderItem();
        item.setVariant(line.variant());
        item.setProductSlug(view.productSlug());
        item.setProductName(view.productName());
        item.setColorName(view.colorName());
        item.setColorHex(view.colorHex());
        item.setSizeCode(view.sizeCode());
        item.setSku(line.variant().getSku());
        item.setImageUrl(view.imageUrl());
        item.setUnitPrice(view.unitPrice());
        item.setQuantity(view.quantity());
        item.setLineTotal(view.lineTotal());
        return item;
    }
}
