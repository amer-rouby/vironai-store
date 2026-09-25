package com.verona.store.ordering.domain;

/**
 * Published whenever an order reaches a status the customer should hear about. Listeners run only
 * after the transaction commits, so a rolled-back change never produces an e-mail.
 */
public record OrderStatusChanged(Long orderId, OrderStatus status) {
}
