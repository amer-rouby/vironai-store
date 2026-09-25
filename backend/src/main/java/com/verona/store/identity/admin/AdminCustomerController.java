package com.verona.store.identity.admin;

import com.verona.store.identity.Role;
import com.verona.store.identity.admin.CustomerDtos.CustomerDetail;
import com.verona.store.identity.admin.CustomerDtos.CustomerRow;
import com.verona.store.identity.admin.CustomerDtos.SetEnabledRequest;
import com.verona.store.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/customers")
@RequiredArgsConstructor
@Tag(name = "Admin · Customers")
public class AdminCustomerController {

    private static final int MAX_PAGE_SIZE = 100;

    private final CustomerAdminService customers;

    @GetMapping
    public PageResponse<CustomerRow> list(@RequestParam(name = "q", required = false) String search,
                                          @RequestParam(required = false) Role role,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return customers.list(search, role, Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
    }

    @GetMapping("/{id}")
    public CustomerDetail get(@PathVariable Long id) {
        return customers.get(id);
    }

    @PostMapping("/{id}/enabled")
    public CustomerDetail setEnabled(@PathVariable Long id, @RequestBody SetEnabledRequest request) {
        return customers.setEnabled(id, request.enabled());
    }
}
