package com.verona.store.ordering.application;

import com.verona.store.catalog.product.ProductImage;
import com.verona.store.catalog.product.ProductVariant;
import com.verona.store.ordering.api.OrderDtos.CartItem;
import com.verona.store.ordering.api.OrderDtos.LineIssue;
import com.verona.store.ordering.api.OrderDtos.Quote;
import com.verona.store.ordering.api.OrderDtos.QuoteLine;
import com.verona.store.ordering.inventory.InventoryRepository;
import com.verona.store.ordering.shipping.Governorate;
import com.verona.store.ordering.shipping.ShippingPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.verona.store.ordering.api.OrderDtos.MAX_QUANTITY_PER_LINE;

/**
 * Prices a cart against the live catalog. Used both for the cart/checkout preview and, inside the
 * order transaction, as the single source of truth for what the customer is charged.
 */
@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final InventoryRepository inventory;
    private final ShippingPolicy shippingPolicy;

    /** A priced line plus the loaded variant, so order placement can snapshot it without reloading. */
    record PricedLine(QuoteLine view, ProductVariant variant) {
    }

    record PricedCart(List<PricedLine> lines, Quote quote) {
    }

    @Transactional(readOnly = true)
    public Quote quote(List<CartItem> items, Governorate governorate) {
        return price(items, governorate).quote();
    }

    PricedCart price(List<CartItem> items, Governorate governorate) {
        Map<Long, Integer> quantities = merge(items);
        Map<Long, ProductVariant> variants = inventory.findForCheckout(quantities.keySet()).stream()
                .collect(Collectors.toMap(ProductVariant::getId, Function.identity()));

        List<PricedLine> lines = new ArrayList<>();
        quantities.forEach((variantId, quantity) -> lines.add(priceLine(variantId, quantity, variants.get(variantId))));

        BigDecimal subtotal = lines.stream()
                .filter(l -> l.view().issue() == null)
                .map(l -> l.view().lineTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal shipping = governorate == null ? null : shippingPolicy.feeFor(governorate, subtotal);
        BigDecimal total = shipping == null ? subtotal : subtotal.add(shipping);
        boolean orderable = !lines.isEmpty() && lines.stream().allMatch(l -> l.view().issue() == null);

        Quote quote = new Quote(lines.stream().map(PricedLine::view).toList(), subtotal, shipping, total,
                shippingPolicy.freeThreshold(), orderable);
        return new PricedCart(lines, quote);
    }

    private static PricedLine priceLine(Long variantId, int quantity, ProductVariant variant) {
        if (variant == null || !variant.getProduct().isActive() || !variant.getProduct().getCategory().isActive()) {
            return new PricedLine(new QuoteLine(variantId, null, null, null, null, null, null,
                    BigDecimal.ZERO, quantity, BigDecimal.ZERO, 0, LineIssue.UNAVAILABLE), null);
        }
        var product = variant.getProduct();
        BigDecimal unitPrice = variant.effectivePrice();
        int stock = variant.getStock();
        LineIssue issue = stock == 0 ? LineIssue.OUT_OF_STOCK : stock < quantity ? LineIssue.INSUFFICIENT_STOCK : null;

        QuoteLine view = new QuoteLine(variantId, product.getSlug(), product.getName(), variant.getColor().getName(),
                variant.getColor().getHexCode(), variant.getSize().getCode(), imageFor(variant), unitPrice, quantity,
                unitPrice.multiply(BigDecimal.valueOf(quantity)), stock, issue);
        return new PricedLine(view, variant);
    }

    /** Prefers a photo tagged with the variant's color, else the product's first photo. */
    private static String imageFor(ProductVariant variant) {
        List<ProductImage> images = variant.getProduct().getImages();
        return images.stream()
                .filter(i -> i.getColor() != null && i.getColor().getId().equals(variant.getColor().getId()))
                .findFirst()
                .or(() -> images.stream().findFirst())
                .map(ProductImage::getUrl)
                .orElse(null);
    }

    /** Same variant listed twice becomes one line; quantities add up but never exceed the per-line cap. */
    private static Map<Long, Integer> merge(List<CartItem> items) {
        Map<Long, Integer> merged = new LinkedHashMap<>();
        items.forEach(i -> merged.merge(i.variantId(), i.quantity(), (a, b) -> Math.min(a + b, MAX_QUANTITY_PER_LINE)));
        return merged;
    }
}
