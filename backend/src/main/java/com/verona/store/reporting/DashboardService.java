package com.verona.store.reporting;

import com.verona.store.ordering.domain.OrderStatus;
import com.verona.store.reporting.DashboardDtos.DailyPoint;
import com.verona.store.reporting.DashboardDtos.Dashboard;
import com.verona.store.reporting.DashboardDtos.LowStockItem;
import com.verona.store.reporting.DashboardDtos.PeriodTotals;
import com.verona.store.reporting.DashboardDtos.TopProduct;
import com.verona.store.shared.domain.LocalizedText;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only sales reporting in plain SQL: aggregates are computed by PostgreSQL in a handful of
 * queries instead of loading orders into memory. Cancelled orders never count as revenue, and
 * calendar days are Cairo days, not UTC days.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    static final ZoneId STORE_ZONE = ZoneId.of("Africa/Cairo");
    static final int LOW_STOCK_THRESHOLD = 3;

    private final JdbcClient jdbc;

    public Dashboard dashboard(int days) {
        LocalDate today = LocalDate.now(STORE_ZONE);
        LocalDate from = today.minusDays(days - 1L);
        LocalDate previousFrom = from.minusDays(days);

        return new Dashboard(days,
                totals(from, today.plusDays(1)),
                totals(previousFrom, from),
                daily(from, today),
                ordersByStatus(),
                topProducts(from, today.plusDays(1)),
                lowStock(),
                LOW_STOCK_THRESHOLD);
    }

    /** [fromInclusive, toExclusive) in store-local days. */
    private PeriodTotals totals(LocalDate fromInclusive, LocalDate toExclusive) {
        var row = jdbc.sql("""
                        select coalesce(sum(o.total), 0)                                     as revenue,
                               count(*)                                                      as orders,
                               coalesce(sum((select sum(i.quantity) from order_items i
                                             where i.order_id = o.id)), 0)                   as items
                        from orders o
                        where o.status not in ('CANCELLED', 'PENDING_PAYMENT')
                          and (o.created_at at time zone :zone)::date >= :from
                          and (o.created_at at time zone :zone)::date <  :to
                        """)
                .param("zone", STORE_ZONE.getId()).param("from", fromInclusive).param("to", toExclusive)
                .query((rs, n) -> new Object[]{rs.getBigDecimal("revenue"), rs.getLong("orders"), rs.getLong("items")})
                .single();

        long newCustomers = jdbc.sql("""
                        select count(*) from users
                        where role = 'CUSTOMER'
                          and (created_at at time zone :zone)::date >= :from
                          and (created_at at time zone :zone)::date <  :to
                        """)
                .param("zone", STORE_ZONE.getId()).param("from", fromInclusive).param("to", toExclusive)
                .query(Long.class).single();

        BigDecimal revenue = (BigDecimal) row[0];
        long orders = (long) row[1];
        BigDecimal aov = orders == 0 ? BigDecimal.ZERO : revenue.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP);
        return new PeriodTotals(revenue, orders, (long) row[2], aov, newCustomers);
    }

    /** One point per day, including days without sales, so the chart has no gaps. */
    private List<DailyPoint> daily(LocalDate from, LocalDate to) {
        return jdbc.sql("""
                        select d::date                                   as day,
                               coalesce(sum(o.total), 0)                 as revenue,
                               count(o.id)                               as orders
                        from generate_series(cast(:from as date), cast(:to as date), interval '1 day') d
                        left join orders o
                               on (o.created_at at time zone :zone)::date = d::date
                              and o.status not in ('CANCELLED', 'PENDING_PAYMENT')
                        group by d
                        order by d
                        """)
                .param("zone", STORE_ZONE.getId()).param("from", from).param("to", to)
                .query((rs, n) -> new DailyPoint(rs.getDate("day").toLocalDate(), rs.getBigDecimal("revenue"), rs.getLong("orders")))
                .list();
    }

    private Map<String, Long> ordersByStatus() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (var status : OrderStatus.values()) {
            counts.put(status.name(), 0L);
        }
        jdbc.sql("select status, count(*) as n from orders group by status")
                .query((rs, n) -> Map.entry(rs.getString("status"), rs.getLong("n")))
                .list()
                .forEach(e -> counts.put(e.getKey(), e.getValue()));
        return counts;
    }

    private List<TopProduct> topProducts(LocalDate fromInclusive, LocalDate toExclusive) {
        return jdbc.sql("""
                        select i.product_slug,
                               max(i.product_name_ar) as name_ar,
                               max(i.product_name_en) as name_en,
                               max(i.image_url)       as image_url,
                               sum(i.quantity)        as quantity,
                               sum(i.line_total)      as revenue
                        from order_items i
                        join orders o on o.id = i.order_id
                        where o.status not in ('CANCELLED', 'PENDING_PAYMENT')
                          and (o.created_at at time zone :zone)::date >= :from
                          and (o.created_at at time zone :zone)::date <  :to
                        group by i.product_slug
                        order by quantity desc, revenue desc
                        limit 5
                        """)
                .param("zone", STORE_ZONE.getId()).param("from", fromInclusive).param("to", toExclusive)
                .query((rs, n) -> new TopProduct(rs.getString("product_slug"),
                        new LocalizedText(rs.getString("name_ar"), rs.getString("name_en")),
                        rs.getString("image_url"), rs.getLong("quantity"), rs.getBigDecimal("revenue")))
                .list();
    }

    private List<LowStockItem> lowStock() {
        return jdbc.sql("""
                        select p.id, p.slug, p.name_ar, p.name_en, c.name_ar as color_ar, c.name_en as color_en,
                               c.hex_code, s.code as size_code, v.sku, v.stock
                        from product_variants v
                        join products p on p.id = v.product_id
                        join colors c   on c.id = v.color_id
                        join sizes s    on s.id = v.size_id
                        where p.active and v.stock <= :threshold
                        order by v.stock asc, p.name_en, s.sort_order
                        limit 10
                        """)
                .param("threshold", LOW_STOCK_THRESHOLD)
                .query((rs, n) -> new LowStockItem(rs.getLong("id"), rs.getString("slug"),
                        new LocalizedText(rs.getString("name_ar"), rs.getString("name_en")),
                        new LocalizedText(rs.getString("color_ar"), rs.getString("color_en")),
                        rs.getString("hex_code"), rs.getString("size_code"), rs.getString("sku"), rs.getInt("stock")))
                .list();
    }
}
