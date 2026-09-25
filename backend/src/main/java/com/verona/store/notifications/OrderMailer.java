package com.verona.store.notifications;

import com.verona.store.config.AppProperties;
import com.verona.store.ordering.domain.Order;
import com.verona.store.ordering.domain.OrderItem;
import com.verona.store.ordering.domain.OrderRepository;
import com.verona.store.ordering.domain.OrderStatus;
import com.verona.store.ordering.domain.OrderStatusChange;
import com.verona.store.settings.StoreSettingsService;
import com.verona.store.shared.domain.LocalizedText;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Currency;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Renders and sends order e-mails: one bilingual template for the customer (their language, RTL for
 * Arabic) and a short alert to the store's notification address when a new order is ready to handle.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderMailer {

    /** Statuses a customer is e-mailed about; PENDING_PAYMENT is silent (they are still at the gateway). */
    static final Set<OrderStatus> CUSTOMER_STATUSES = EnumSet.of(
            OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED);

    private final OrderRepository orders;
    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templates;
    private final MessageSource messages;
    private final StoreSettingsService settings;
    private final AppProperties properties;

    @Transactional(readOnly = true)
    public void send(Long orderId, OrderStatus status) {
        Order order = orders.findById(orderId).orElse(null);
        if (order == null || order.getStatus() != status) {
            return; // Deleted, or already moved on; the later event will describe the current state.
        }
        if (CUSTOMER_STATUSES.contains(status)) {
            sendToCustomer(order, status);
        }
        if (status == OrderStatus.PENDING) {
            String storeEmail = settings.orderNotificationEmail();
            if (StringUtils.hasText(storeEmail)) {
                sendToStore(order, storeEmail);
            }
        }
    }

    private void sendToCustomer(Order order, OrderStatus status) {
        Locale locale = Locale.forLanguageTag(order.getUser().getPreferredLocale());
        Context ctx = baseContext(order, locale);
        ctx.setVariable("status", status.name());
        ctx.setVariable("paidOnline", order.getPaymentMethod().name().equals("CARD"));
        ctx.setVariable("statusNote", latestNote(order, status));
        String subject = messages.getMessage("mail.subject." + status.name(), new Object[]{order.getOrderNumber()}, locale);
        deliver(order.getUser().getEmail(), subject, templates.process("mail/order-status", ctx));
    }

    private void sendToStore(Order order, String storeEmail) {
        Locale locale = Locale.forLanguageTag("ar");
        Context ctx = baseContext(order, locale);
        ctx.setVariable("customerName", order.getUser().getFullName());
        ctx.setVariable("customerEmail", order.getUser().getEmail());
        ctx.setVariable("adminUrl", properties.storefront().url() + "/ar/admin/orders");
        String subject = messages.getMessage("mail.store.subject",
                new Object[]{order.getOrderNumber(), money(order.getTotal(), locale)}, locale);
        deliver(storeEmail, subject, templates.process("mail/new-order-store", ctx));
    }

    private Context baseContext(Order order, Locale locale) {
        Context ctx = new Context(locale);
        boolean arabic = "ar".equals(locale.getLanguage());
        ctx.setVariable("dir", arabic ? "rtl" : "ltr");
        ctx.setVariable("align", arabic ? "right" : "left");
        ctx.setVariable("brand", arabic ? "فيرونا" : "VIRONAI");
        ctx.setVariable("orderNumber", order.getOrderNumber());
        ctx.setVariable("recipientName", order.getRecipientName());
        ctx.setVariable("address", String.join(arabic ? "، " : ", ", nonBlank(
                order.getStreet(), order.getBuilding(), order.getCity(),
                messages.getMessage("governorate." + order.getGovernorate().name(), null, locale))));
        ctx.setVariable("phone", order.getPhone());
        ctx.setVariable("subtotal", money(order.getSubtotal(), locale));
        ctx.setVariable("shipping", order.getShippingFee().signum() == 0
                ? messages.getMessage("mail.free", null, locale) : money(order.getShippingFee(), locale));
        ctx.setVariable("total", money(order.getTotal(), locale));
        ctx.setVariable("items", order.getItems().stream().map(i -> line(i, locale, arabic)).toList());
        ctx.setVariable("orderUrl", properties.storefront().url() + "/" + locale.getLanguage() + "/account/orders/"
                + URLEncoder.encode(order.getOrderNumber(), StandardCharsets.UTF_8));
        return ctx;
    }

    private static Map<String, Object> line(OrderItem i, Locale locale, boolean arabic) {
        return Map.of(
                "name", pick(i.getProductName(), arabic),
                "variant", pick(i.getColorName(), arabic) + " · " + i.getSizeCode(),
                "quantity", i.getQuantity(),
                "total", money(i.getLineTotal(), locale));
    }

    private void deliver(String to, String subject, String html) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(properties.mail().from());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("E-mail '{}' sent to {}", subject, to);
        } catch (MessagingException e) {
            throw new IllegalStateException("Could not build e-mail", e);
        }
    }

    private static String latestNote(Order order, OrderStatus status) {
        List<OrderStatusChange> history = order.getHistory();
        for (int i = history.size() - 1; i >= 0; i--) {
            if (history.get(i).getStatus() == status) {
                return history.get(i).getNote();
            }
        }
        return null;
    }

    static String money(BigDecimal amount, Locale locale) {
        NumberFormat format = NumberFormat.getCurrencyInstance(
                "ar".equals(locale.getLanguage()) ? Locale.forLanguageTag("ar-EG") : Locale.forLanguageTag("en-EG"));
        format.setCurrency(Currency.getInstance("EGP"));
        format.setMaximumFractionDigits(amount.stripTrailingZeros().scale() > 0 ? 2 : 0);
        return format.format(amount);
    }

    private static String pick(LocalizedText text, boolean arabic) {
        return arabic ? text.getAr() : text.getEn();
    }

    private static List<String> nonBlank(String... parts) {
        return java.util.Arrays.stream(parts).filter(StringUtils::hasText).toList();
    }
}
