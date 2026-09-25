package com.verona.store.identity.admin;

import com.verona.store.identity.Role;
import com.verona.store.identity.User;
import com.verona.store.identity.UserRepository;
import com.verona.store.identity.admin.CustomerDtos.CustomerDetail;
import com.verona.store.identity.admin.CustomerDtos.CustomerRow;
import com.verona.store.ordering.application.OrderService;
import com.verona.store.shared.exception.BusinessException;
import com.verona.store.shared.exception.NotFoundException;
import com.verona.store.shared.web.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

/**
 * Back-office view of customer accounts with their purchase totals. Aggregates come from one SQL query
 * per page; accounts are never deleted (orders reference them), only disabled.
 */
@Service
@RequiredArgsConstructor
public class CustomerAdminService {

    private static final String SELECT = """
            select u.id, u.full_name, u.email, u.phone, u.role, u.enabled, u.created_at,
                   count(o.id)                                                   as order_count,
                   coalesce(sum(o.total) filter (where o.status not in ('CANCELLED', 'PENDING_PAYMENT')), 0) as total_spent,
                   max(o.created_at)                                             as last_order_at
            from users u
            left join orders o on o.user_id = u.id
            """;

    private static final String FILTER = """
            where (cast(:q as text) is null
                   or lower(u.full_name) like :like
                   or lower(u.email) like :like
                   or u.phone like :like)
              and (cast(:role as text) is null or u.role = :role)
            """;

    private final JdbcClient jdbc;
    private final UserRepository users;
    private final OrderService orders;

    @Transactional(readOnly = true)
    public PageResponse<CustomerRow> list(String search, Role role, int page, int size) {
        String q = StringUtils.hasText(search) ? search.trim().toLowerCase() : null;
        String like = q == null ? null : "%" + q.replace("%", "\\%").replace("_", "\\_") + "%";
        String roleName = role == null ? null : role.name();

        List<CustomerRow> rows = jdbc.sql(SELECT + FILTER + """
                        group by u.id
                        order by u.created_at desc, u.id desc
                        limit :limit offset :offset
                        """)
                .param("q", q).param("like", like).param("role", roleName)
                .param("limit", size).param("offset", (long) page * size)
                .query(CustomerAdminService::row)
                .list();
        long total = jdbc.sql("select count(*) from users u " + FILTER)
                .param("q", q).param("like", like).param("role", roleName)
                .query(Long.class).single();

        return new PageResponse<>(rows, page, size, total, (int) Math.ceil(total / (double) size));
    }

    @Transactional(readOnly = true)
    public CustomerDetail get(Long id) {
        CustomerRow row = jdbc.sql(SELECT + " where u.id = :id group by u.id")
                .param("id", id)
                .query(CustomerAdminService::row)
                .optional()
                .orElseThrow(() -> new NotFoundException("Customer", id));
        var recent = orders.mine(id, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"))).content();
        return new CustomerDetail(row, recent);
    }

    @Transactional
    public CustomerDetail setEnabled(Long id, boolean enabled) {
        User user = users.findById(id).orElseThrow(() -> new NotFoundException("Customer", id));
        if (user.getRole() == Role.ADMIN) {
            // Protects against locking the store out of its own back office.
            throw new BusinessException("ADMIN_ACCOUNT_PROTECTED", "Administrator accounts cannot be disabled here",
                    HttpStatus.CONFLICT);
        }
        user.setEnabled(enabled);
        users.saveAndFlush(user);
        return get(id);
    }

    private static CustomerRow row(ResultSet rs, int n) throws SQLException {
        Timestamp last = rs.getTimestamp("last_order_at");
        return new CustomerRow(rs.getLong("id"), rs.getString("full_name"), rs.getString("email"), rs.getString("phone"),
                Role.valueOf(rs.getString("role")), rs.getBoolean("enabled"), rs.getTimestamp("created_at").toInstant(),
                rs.getLong("order_count"), rs.getBigDecimal("total_spent"), last == null ? null : last.toInstant());
    }
}
