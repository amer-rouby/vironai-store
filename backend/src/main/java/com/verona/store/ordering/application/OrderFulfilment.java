package com.verona.store.ordering.application;

import com.verona.store.identity.User;
import com.verona.store.ordering.domain.Order;
import com.verona.store.ordering.domain.OrderStatus;
import com.verona.store.ordering.inventory.InventoryRepository;

import java.util.Comparator;

/**
 * Stock-affecting order transitions shared by the customer, back-office and payment-expiry flows:
 * moving to CANCELLED always returns the reserved stock, in variant-id order to avoid lock cycles.
 */
public final class OrderFulfilment {

    private OrderFulfilment() {
    }

    /** {@code by} is null when the system cancels (e.g. an unpaid order expiring). */
    public static void cancel(Order order, String note, User by, InventoryRepository inventory) {
        order.transitionTo(OrderStatus.CANCELLED, note, by);
        order.getItems().stream()
                .filter(i -> i.getVariant() != null)
                .sorted(Comparator.comparing(i -> i.getVariant().getId()))
                .forEach(i -> inventory.release(i.getVariant().getId(), i.getQuantity()));
    }
}
