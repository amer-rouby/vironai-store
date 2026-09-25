package com.verona.store.ordering.domain;

import com.verona.store.shared.crud.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends BaseRepository<Order> {

    Optional<Order> findByUserIdAndIdempotencyKey(Long userId, String idempotencyKey);

    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);

    Page<Order> findAllByUserId(Long userId, Pageable pageable);

    List<Order> findAllByStatusAndPaymentExpiresAtBefore(OrderStatus status, Instant cutoff);

    @Query(value = "select nextval('order_number_seq')", nativeQuery = true)
    long nextOrderNumber();
}
