package com.verona.store.payments;

import com.verona.store.config.AppProperties;
import com.verona.store.identity.User;
import com.verona.store.ordering.application.OrderFulfilment;
import com.verona.store.ordering.domain.Order;
import com.verona.store.ordering.domain.OrderRepository;
import com.verona.store.ordering.domain.OrderStatus;
import com.verona.store.ordering.domain.OrderStatusChanged;
import com.verona.store.ordering.domain.PaymentMethod;
import com.verona.store.ordering.inventory.InventoryRepository;
import com.verona.store.payments.gateway.PaymentGateway;
import com.verona.store.payments.gateway.PaymentGateway.CheckoutRequest;
import com.verona.store.payments.gateway.PaymentGateway.Line;
import com.verona.store.payments.gateway.PaymentGateways;
import com.verona.store.payments.gateway.PaymobSignature;
import com.verona.store.shared.exception.BusinessException;
import com.verona.store.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Online payments. Starting a payment only creates a gateway session; an order is marked paid solely
 * from a callback whose HMAC verifies, whose amount matches, and which is processed at most once.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String CURRENCY = "EGP";

    private final PaymentRepository payments;
    private final OrderRepository orders;
    private final InventoryRepository inventory;
    private final PaymentGateways gateways;
    private final AppProperties properties;
    private final ApplicationEventPublisher events;

    /** Opens a gateway checkout for an order awaiting payment; returns the URL to send the shopper to. */
    @Transactional
    public String start(Order order, User customer) {
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT || order.getPaymentMethod() != PaymentMethod.CARD) {
            throw new BusinessException("ORDER_NOT_AWAITING_PAYMENT", "This order is not awaiting an online payment");
        }
        if (order.getPaymentExpiresAt() != null && order.getPaymentExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("PAYMENT_WINDOW_EXPIRED", "The time to pay for this order has passed");
        }
        PaymentGateway gateway = gateways.card().orElseThrow(() -> new BusinessException(
                "PAYMENT_GATEWAY_NOT_CONFIGURED", "Online payment is not available", HttpStatus.SERVICE_UNAVAILABLE));

        long amountCents = toCents(order.getTotal());
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider(gateway.provider());
        payment.setAmountCents(amountCents);
        payment.setCurrency(CURRENCY);
        payments.saveAndFlush(payment);

        // One line for the whole order: the gateway requires item amounts to add up to the charged total,
        // and the total includes shipping.
        var session = gateway.createCheckout(new CheckoutRequest(
                order.getOrderNumber() + "-" + payment.getId(),
                order.getOrderNumber(),
                amountCents,
                CURRENCY,
                order.getRecipientName(),
                customer.getEmail(),
                order.getPhone(),
                order.getCity(),
                order.getStreet(),
                customer.getPreferredLocale(),
                List.of(new Line("Order " + order.getOrderNumber(), amountCents, 1))));
        payment.setProviderOrderId(session.providerOrderId());
        return session.redirectUrl();
    }

    public enum CallbackResult {
        PAID,
        FAILED,
        IGNORED
    }

    /**
     * Handles Paymob's "transaction processed" callback. Rejects bad signatures; is idempotent for
     * retries (Paymob re-sends until it gets a 200).
     */
    @Transactional
    public CallbackResult handlePaymobCallback(JsonNode body, String hmac) {
        JsonNode obj = body.path("obj");
        if (!PaymobSignature.verify(obj, hmac, properties.payments().paymob().hmacSecret())) {
            throw new BusinessException("INVALID_SIGNATURE", "Callback signature does not verify", HttpStatus.UNAUTHORIZED);
        }
        String providerOrderId = obj.path("order").path("id").asString("");
        Payment payment = payments.findByProviderAndProviderOrderId("PAYMOB", providerOrderId).orElse(null);
        if (payment == null) {
            log.warn("Paymob callback for unknown order {}", providerOrderId);
            return CallbackResult.IGNORED;
        }
        if (payment.getStatus() == Payment.Status.PAID) {
            return CallbackResult.IGNORED;
        }

        boolean success = obj.path("success").asBoolean(false) && !obj.path("pending").asBoolean(false);
        long amount = obj.path("amount_cents").asLong(-1);
        if (success && amount != payment.getAmountCents()) {
            // A signed callback with a different amount is never trusted to settle this order.
            log.error("Paymob amount mismatch for payment {}: expected {}, got {}", payment.getId(), payment.getAmountCents(), amount);
            payment.setStatus(Payment.Status.FAILED);
            payment.setFailureReason("AMOUNT_MISMATCH");
            return CallbackResult.FAILED;
        }

        payment.setTransactionId(obj.path("id").asString(null));
        if (!success) {
            payment.setStatus(Payment.Status.FAILED);
            payment.setFailureReason(truncate(obj.path("data").path("message").asString("declined")));
            return CallbackResult.FAILED;
        }

        payment.setStatus(Payment.Status.PAID);
        Order order = payment.getOrder();
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            order.transitionTo(OrderStatus.PENDING, "Paid online · transaction " + payment.getTransactionId(), null);
            order.setPaymentExpiresAt(null);
            events.publishEvent(new OrderStatusChanged(order.getId(), OrderStatus.PENDING));
        } else {
            // Paid after the order was already cancelled (e.g. expired): money must be refunded by hand.
            payment.setFailureReason("PAID_AFTER_CANCELLATION");
            log.error("Order {} was paid (txn {}) while {}; refund required", order.getOrderNumber(),
                    payment.getTransactionId(), order.getStatus());
        }
        return CallbackResult.PAID;
    }

    /** Customer retry after a declined card, within the payment window. */
    @Transactional
    public String retry(Long userId, String orderNumber) {
        Order order = orders.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new NotFoundException("Order", orderNumber));
        return start(order, order.getUser());
    }

    /** Unpaid card orders give their reserved stock back once the payment window closes. */
    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT30S")
    @Transactional
    public void expireUnpaidOrders() {
        var expired = orders.findAllByStatusAndPaymentExpiresAtBefore(OrderStatus.PENDING_PAYMENT, Instant.now());
        for (Order order : expired) {
            OrderFulfilment.cancel(order, "Payment not completed in time", null, inventory);
            events.publishEvent(new OrderStatusChanged(order.getId(), OrderStatus.CANCELLED));
            log.info("Order {} cancelled: payment window expired", order.getOrderNumber());
        }
    }

    static long toCents(BigDecimal amount) {
        return amount.movePointRight(2).longValueExact();
    }

    private static String truncate(String value) {
        return value.length() > 255 ? value.substring(0, 255) : value;
    }
}
