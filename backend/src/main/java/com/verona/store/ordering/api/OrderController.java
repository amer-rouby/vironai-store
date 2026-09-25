package com.verona.store.ordering.api;

import com.verona.store.ordering.api.OrderDtos.OrderSummary;
import com.verona.store.ordering.api.OrderDtos.OrderView;
import com.verona.store.ordering.api.OrderDtos.PlaceOrderRequest;
import com.verona.store.ordering.application.OrderService;
import com.verona.store.payments.PaymentService;
import com.verona.store.security.AuthUser;
import com.verona.store.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Customer · Orders")
public class OrderController {

    private final OrderService orders;
    private final PaymentService payments;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderView place(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody PlaceOrderRequest request) {
        return orders.place(user.id(), request);
    }

    @GetMapping
    public PageResponse<OrderSummary> mine(@AuthenticationPrincipal AuthUser user,
                                           @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
                                           Pageable pageable) {
        return orders.mine(user.id(), pageable);
    }

    @GetMapping("/{orderNumber}")
    public OrderView one(@AuthenticationPrincipal AuthUser user, @PathVariable String orderNumber) {
        return orders.mine(user.id(), orderNumber);
    }

    /** New gateway session for a card order still awaiting payment (e.g. after a declined card). */
    @PostMapping("/{orderNumber}/pay")
    public Map<String, String> pay(@AuthenticationPrincipal AuthUser user, @PathVariable String orderNumber) {
        return Map.of("paymentUrl", payments.retry(user.id(), orderNumber));
    }

    @PostMapping("/{orderNumber}/cancel")
    public OrderView cancel(@AuthenticationPrincipal AuthUser user, @PathVariable String orderNumber) {
        return orders.cancel(user.id(), orderNumber);
    }
}
