package com.verona.store.ordering.application;

import com.verona.store.identity.UserRepository;
import com.verona.store.ordering.api.OrderDtos.ChangeStatusRequest;
import com.verona.store.ordering.api.OrderDtos.OrderSummary;
import com.verona.store.ordering.api.OrderDtos.OrderView;
import com.verona.store.ordering.application.OrderFulfilment;
import com.verona.store.ordering.domain.Order;
import com.verona.store.ordering.domain.OrderRepository;
import com.verona.store.ordering.domain.OrderStatus;
import com.verona.store.ordering.domain.OrderStatusChanged;
import com.verona.store.ordering.inventory.InventoryRepository;
import com.verona.store.shared.exception.BusinessException;
import com.verona.store.shared.exception.NotFoundException;
import com.verona.store.shared.web.PageResponse;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminOrderService {

    private final OrderRepository orders;
    private final UserRepository users;
    private final InventoryRepository inventory;
    private final ApplicationEventPublisher events;

    @Transactional(readOnly = true)
    public PageResponse<OrderSummary> list(String search, OrderStatus status, Pageable pageable) {
        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(search)) {
                String term = search.trim();
                String like = "%" + term.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("orderNumber")), like),
                        cb.like(cb.lower(root.get("recipientName")), like),
                        cb.like(root.get("phone"), "%" + term + "%")));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return PageResponse.of(orders.findAll(spec, pageable), OrderViews::summary);
    }

    @Transactional(readOnly = true)
    public OrderView get(Long id) {
        return OrderViews.forAdmin(find(id));
    }

    @Transactional
    public OrderView changeStatus(Long id, ChangeStatusRequest request, Long adminId) {
        Order order = find(id);
        if (!order.getStatus().nextForAdmin().contains(request.status())) {
            // Includes PENDING_PAYMENT -> PENDING: only a verified gateway callback may mark an order paid.
            throw new BusinessException("INVALID_STATUS_TRANSITION",
                    "Cannot move order from " + order.getStatus() + " to " + request.status(), HttpStatus.CONFLICT);
        }
        var admin = users.getReferenceById(adminId);
        String note = StringUtils.hasText(request.note()) ? request.note().trim() : null;
        if (request.status() == OrderStatus.CANCELLED) {
            OrderFulfilment.cancel(order, note, admin, inventory);
        } else {
            order.transitionTo(request.status(), note, admin);
        }
        Order saved = orders.saveAndFlush(order);
        events.publishEvent(new OrderStatusChanged(saved.getId(), saved.getStatus()));
        return OrderViews.forAdmin(saved);
    }

    private Order find(Long id) {
        return orders.findById(id).orElseThrow(() -> new NotFoundException("Order", id));
    }
}
