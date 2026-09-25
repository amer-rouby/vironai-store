package com.verona.store.ordering.domain;

import java.util.EnumSet;
import java.util.Set;

/**
 * Order lifecycle. Every allowed move is declared here, so no service can invent a transition.
 *
 * <pre>
 * PENDING_PAYMENT ──(paid)──► PENDING ──► CONFIRMED ──► SHIPPED ──► DELIVERED
 *        │                       │            │
 *        └──(expired)────────────┴────────────┴──► CANCELLED   (stock is returned)
 * </pre>
 * Cash-on-delivery orders start at PENDING; card orders start at PENDING_PAYMENT and only the payment
 * gateway's verified callback moves them on.
 */
public enum OrderStatus {
    PENDING_PAYMENT,
    PENDING,
    CONFIRMED,
    SHIPPED,
    DELIVERED,
    CANCELLED;

    public Set<OrderStatus> next() {
        return switch (this) {
            case PENDING_PAYMENT -> EnumSet.of(PENDING, CANCELLED);
            case PENDING -> EnumSet.of(CONFIRMED, CANCELLED);
            case CONFIRMED -> EnumSet.of(SHIPPED, CANCELLED);
            case SHIPPED -> EnumSet.of(DELIVERED);
            case DELIVERED, CANCELLED -> EnumSet.noneOf(OrderStatus.class);
        };
    }

    public boolean canMoveTo(OrderStatus target) {
        return next().contains(target);
    }

    /** Customers may cancel until the store confirms (including an order still awaiting payment). */
    public boolean customerCancellable() {
        return this == PENDING || this == PENDING_PAYMENT;
    }

    /** Statuses the back office may set by hand; payment confirmation is reserved for the gateway. */
    public Set<OrderStatus> nextForAdmin() {
        Set<OrderStatus> allowed = EnumSet.noneOf(OrderStatus.class);
        allowed.addAll(next());
        if (this == PENDING_PAYMENT) {
            allowed.remove(PENDING);
        }
        return allowed;
    }

    /** Orders that represent money received or promised (unpaid card orders are not revenue yet). */
    public boolean countsAsSale() {
        return this != CANCELLED && this != PENDING_PAYMENT;
    }
}
