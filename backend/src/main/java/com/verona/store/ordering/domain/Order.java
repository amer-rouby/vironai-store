package com.verona.store.ordering.domain;

import com.verona.store.identity.User;
import com.verona.store.ordering.shipping.Governorate;
import com.verona.store.shared.domain.BaseEntity;
import com.verona.store.shared.exception.BusinessException;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Aggregate root for a purchase. Totals are computed once on the server when the order is placed;
 * status only changes through {@link #transitionTo}, which enforces {@link OrderStatus} rules.
 */
@Getter
@Setter
@Entity(name = "CustomerOrder") // "Order" is a JPQL keyword
@Table(name = "orders")
public class Order extends BaseEntity {

    @Column(nullable = false, unique = true, length = 20)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 64)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingFee;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false, length = 120)
    private String recipientName;

    @Column(nullable = false, length = 30)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private Governorate governorate;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 200)
    private String street;

    @Column(length = 120)
    private String building;

    @Column(length = 500)
    private String notes;

    /** Card orders only: unpaid by this instant, the order is cancelled and its stock released. */
    private Instant paymentExpiresAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("changedAt ASC, id ASC")
    private List<OrderStatusChange> history = new ArrayList<>();

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }

    /** Sets the starting status and records the first history entry; call once, right after assembly. */
    public void open(OrderStatus initial, User placedBy) {
        if (initial != OrderStatus.PENDING && initial != OrderStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException("Orders start as PENDING or PENDING_PAYMENT, not " + initial);
        }
        status = initial;
        record(initial, null, placedBy);
    }

    public void transitionTo(OrderStatus target, String note, User changedBy) {
        if (!status.canMoveTo(target)) {
            throw new BusinessException("INVALID_STATUS_TRANSITION",
                    "Cannot move order from " + status + " to " + target, HttpStatus.CONFLICT);
        }
        status = target;
        record(target, note, changedBy);
    }

    private void record(OrderStatus value, String note, User changedBy) {
        OrderStatusChange change = new OrderStatusChange();
        change.setOrder(this);
        change.setStatus(value);
        change.setNote(note);
        change.setChangedBy(changedBy);
        history.add(change);
    }
}
