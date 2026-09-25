package com.verona.store.ordering.application;

import com.verona.store.ordering.api.OrderDtos.CustomerView;
import com.verona.store.ordering.api.OrderDtos.OrderLineView;
import com.verona.store.ordering.api.OrderDtos.OrderSummary;
import com.verona.store.ordering.api.OrderDtos.OrderView;
import com.verona.store.ordering.api.OrderDtos.ShippingAddress;
import com.verona.store.ordering.api.OrderDtos.StatusChangeView;
import com.verona.store.ordering.domain.Order;
import com.verona.store.ordering.domain.OrderItem;

import java.util.List;

/** Order -> API views. The admin flavour adds the customer and the allowed next statuses. */
final class OrderViews {

    private OrderViews() {
    }

    static OrderView forCustomer(Order order) {
        return view(order, false, null);
    }

    static OrderView forCustomer(Order order, String paymentUrl) {
        return view(order, false, paymentUrl);
    }

    static OrderView forAdmin(Order order) {
        return view(order, true, null);
    }

    private static OrderView view(Order o, boolean admin, String paymentUrl) {
        var address = new ShippingAddress(o.getRecipientName(), o.getPhone(), o.getGovernorate(), o.getCity(),
                o.getStreet(), o.getBuilding());
        var items = o.getItems().stream().map(OrderViews::line).toList();
        var history = o.getHistory().stream()
                .map(h -> new StatusChangeView(h.getStatus(), h.getNote(), h.getChangedAt()))
                .toList();
        var customer = admin
                ? new CustomerView(o.getUser().getId(), o.getUser().getFullName(), o.getUser().getEmail())
                : null;
        return new OrderView(o.getId(), o.getOrderNumber(), o.getStatus(), o.getPaymentMethod(), o.getSubtotal(),
                o.getShippingFee(), o.getTotal(), address, o.getNotes(), o.getCreatedAt(), items, history,
                o.getStatus().customerCancellable(), admin ? List.copyOf(o.getStatus().nextForAdmin()) : List.of(), customer,
                paymentUrl, o.getPaymentExpiresAt());
    }

    static OrderSummary summary(Order o) {
        List<OrderItem> items = o.getItems();
        return new OrderSummary(o.getId(), o.getOrderNumber(), o.getStatus(), o.getTotal(),
                items.stream().mapToInt(OrderItem::getQuantity).sum(), o.getCreatedAt(),
                items.isEmpty() ? null : items.get(0).getImageUrl(), o.getRecipientName(), o.getGovernorate());
    }

    private static OrderLineView line(OrderItem i) {
        return new OrderLineView(i.getProductSlug(), i.getProductName(), i.getColorName(), i.getColorHex(),
                i.getSizeCode(), i.getSku(), i.getImageUrl(), i.getUnitPrice(), i.getQuantity(), i.getLineTotal());
    }
}
