package com.verona.store.ordering.api;

import com.verona.store.ordering.domain.OrderStatus;
import com.verona.store.ordering.domain.PaymentMethod;
import com.verona.store.ordering.shipping.Governorate;
import com.verona.store.shared.domain.LocalizedText;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {
    }

    public static final int MAX_QUANTITY_PER_LINE = 10;

    // Requests ------------------------------------------------------------------------------------

    /** The client only says what and how many; every price is decided by the server. */
    public record CartItem(@NotNull Long variantId, @Min(1) @Max(MAX_QUANTITY_PER_LINE) int quantity) {
    }

    public record QuoteRequest(@NotEmpty @Size(max = 50) List<@Valid CartItem> items, Governorate governorate) {
    }

    public record ShippingAddress(
            @NotBlank @Size(max = 120) String recipientName,
            @NotBlank @Pattern(regexp = "^01[0125][0-9]{8}$", message = "must be an Egyptian mobile number") String phone,
            @NotNull Governorate governorate,
            @NotBlank @Size(max = 80) String city,
            @NotBlank @Size(max = 200) String street,
            @Size(max = 120) String building
    ) {
    }

    public record PlaceOrderRequest(
            @NotBlank @Size(min = 8, max = 64) String idempotencyKey,
            @NotEmpty @Size(max = 50) List<@Valid CartItem> items,
            @NotNull @Valid ShippingAddress address,
            @NotNull PaymentMethod paymentMethod,
            @Size(max = 500) String notes
    ) {
    }

    public record ChangeStatusRequest(@NotNull OrderStatus status, @Size(max = 500) String note) {
    }

    // Quote ---------------------------------------------------------------------------------------

    public enum LineIssue {
        /** Variant, product or category no longer exists / is hidden. */
        UNAVAILABLE,
        OUT_OF_STOCK,
        /** Fewer pieces left than requested; {@code availableStock} says how many. */
        INSUFFICIENT_STOCK
    }

    public record QuoteLine(
            Long variantId,
            String productSlug,
            LocalizedText productName,
            LocalizedText colorName,
            String colorHex,
            String sizeCode,
            String imageUrl,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal,
            int availableStock,
            LineIssue issue
    ) {
    }

    public record Quote(
            List<QuoteLine> lines,
            BigDecimal subtotal,
            /** null until a governorate is known. */
            BigDecimal shippingFee,
            BigDecimal total,
            BigDecimal freeShippingThreshold,
            boolean orderable
    ) {
    }

    // Orders --------------------------------------------------------------------------------------

    public record OrderLineView(
            String productSlug,
            LocalizedText productName,
            LocalizedText colorName,
            String colorHex,
            String sizeCode,
            String sku,
            String imageUrl,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal
    ) {
    }

    public record StatusChangeView(OrderStatus status, String note, Instant changedAt) {
    }

    public record OrderView(
            Long id,
            String orderNumber,
            OrderStatus status,
            PaymentMethod paymentMethod,
            BigDecimal subtotal,
            BigDecimal shippingFee,
            BigDecimal total,
            ShippingAddress address,
            String notes,
            Instant placedAt,
            List<OrderLineView> items,
            List<StatusChangeView> history,
            boolean cancellable,
            /** Admin only: the transitions the order can take next. */
            List<OrderStatus> nextStatuses,
            CustomerView customer,
            /** Card orders awaiting payment: where to pay (present only in the place/retry response). */
            String paymentUrl,
            Instant paymentExpiresAt
    ) {
    }

    public record CustomerView(Long id, String fullName, String email) {
    }

    public record OrderSummary(
            Long id,
            String orderNumber,
            OrderStatus status,
            BigDecimal total,
            int itemCount,
            Instant placedAt,
            String previewImageUrl,
            String recipientName,
            Governorate governorate
    ) {
    }
}
