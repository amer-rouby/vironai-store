package com.verona.store.ordering.api;

import com.verona.store.ordering.api.OrderDtos.ChangeStatusRequest;
import com.verona.store.ordering.api.OrderDtos.OrderSummary;
import com.verona.store.ordering.api.OrderDtos.OrderView;
import com.verona.store.ordering.application.AdminOrderService;
import com.verona.store.ordering.domain.OrderStatus;
import com.verona.store.security.AuthUser;
import com.verona.store.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Orders are created by customers only; the back office reads them and drives their status. */
@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
@Tag(name = "Admin · Orders")
public class AdminOrderController {

    private final AdminOrderService orders;

    @GetMapping
    public PageResponse<OrderSummary> list(@RequestParam(name = "q", required = false) String search,
                                           @RequestParam(required = false) OrderStatus status,
                                           @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
                                           Pageable pageable) {
        return orders.list(search, status, pageable);
    }

    @GetMapping("/{id}")
    public OrderView get(@PathVariable Long id) {
        return orders.get(id);
    }

    @PostMapping("/{id}/status")
    public OrderView changeStatus(@PathVariable Long id, @Valid @RequestBody ChangeStatusRequest request,
                                  @AuthenticationPrincipal AuthUser admin) {
        return orders.changeStatus(id, request, admin.id());
    }
}
