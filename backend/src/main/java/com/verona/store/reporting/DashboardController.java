package com.verona.store.reporting;

import com.verona.store.reporting.DashboardDtos.Dashboard;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin · Dashboard")
public class DashboardController {

    private static final Set<Integer> ALLOWED_PERIODS = Set.of(7, 30, 90);

    private final DashboardService dashboard;

    @GetMapping
    public Dashboard get(@RequestParam(defaultValue = "30") int days) {
        return dashboard.dashboard(ALLOWED_PERIODS.contains(days) ? days : 30);
    }
}
