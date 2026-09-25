package com.verona.store.identity.admin;

import com.verona.store.identity.Role;
import com.verona.store.ordering.api.OrderDtos.OrderSummary;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class CustomerDtos {

    private CustomerDtos() {
    }

    public record CustomerRow(
            Long id,
            String fullName,
            String email,
            String phone,
            Role role,
            boolean enabled,
            Instant joinedAt,
            long orderCount,
            /** Sum of non-cancelled orders. */
            BigDecimal totalSpent,
            Instant lastOrderAt
    ) {
    }

    public record CustomerDetail(CustomerRow customer, List<OrderSummary> recentOrders) {
    }

    public record SetEnabledRequest(boolean enabled) {
    }
}
