package com.verona.store.reporting;

import com.verona.store.shared.domain.LocalizedText;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class DashboardDtos {

    private DashboardDtos() {
    }

    /** Figures for one period; the same shape is returned for the previous period to compute trends. */
    public record PeriodTotals(BigDecimal revenue, long orders, long itemsSold, BigDecimal averageOrderValue,
                               long newCustomers) {
    }

    public record DailyPoint(LocalDate day, BigDecimal revenue, long orders) {
    }

    public record TopProduct(String slug, LocalizedText name, String imageUrl, long quantity, BigDecimal revenue) {
    }

    public record LowStockItem(Long productId, String slug, LocalizedText productName, LocalizedText colorName,
                               String colorHex, String sizeCode, String sku, int stock) {
    }

    public record Dashboard(
            int days,
            PeriodTotals current,
            PeriodTotals previous,
            List<DailyPoint> daily,
            /** All-time count per status, so the back office sees what is waiting on it. */
            Map<String, Long> ordersByStatus,
            List<TopProduct> topProducts,
            List<LowStockItem> lowStock,
            int lowStockThreshold
    ) {
    }
}
