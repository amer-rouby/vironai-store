package com.verona.store.payments;

import com.verona.store.ordering.domain.Order;
import com.verona.store.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** One online payment attempt for an order. */
@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {

    public enum Status {
        INITIATED,
        PAID,
        FAILED
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(nullable = false, length = 20)
    private String provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.INITIATED;

    private long amountCents;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(length = 64)
    private String providerOrderId;

    @Column(length = 64)
    private String transactionId;

    @Column(length = 255)
    private String failureReason;
}
