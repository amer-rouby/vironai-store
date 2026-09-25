package com.verona.store.catalog.storefront;

import com.verona.store.shared.domain.LocalizedText;

import java.math.BigDecimal;
import java.util.List;

/**
 * Read models for shoppers: only what the storefront renders, never admin-only fields.
 */
public final class StorefrontDtos {

    private StorefrontDtos() {
    }

    public record CategoryView(Long id, String slug, LocalizedText name, String imageUrl, Long parentId) {
    }

    public record ColorView(Long id, LocalizedText name, String hexCode) {
    }

    public record SizeView(Long id, String code) {
    }

    public record FiltersView(List<CategoryView> categories, List<ColorView> colors, List<SizeView> sizes) {
    }

    public record ProductCard(
            Long id,
            String slug,
            LocalizedText name,
            BigDecimal price,
            BigDecimal compareAtPrice,
            String imageUrl,
            String hoverImageUrl,
            List<String> colorHexes,
            boolean inStock
    ) {
    }

    public record ProductDetail(
            Long id,
            String slug,
            LocalizedText name,
            LocalizedText description,
            CategoryView category,
            BigDecimal basePrice,
            BigDecimal compareAtPrice,
            List<ImageView> images,
            List<ColorView> colors,
            List<SizeView> sizes,
            List<VariantView> variants
    ) {
    }

    public record ImageView(String url, Long colorId) {
    }

    public record VariantView(Long id, Long colorId, Long sizeId, BigDecimal price, int stock) {
    }

    public enum ProductSort {
        NEWEST, PRICE_ASC, PRICE_DESC
    }

    public record ProductQuery(
            String category,
            String q,
            List<Long> colors,
            List<Long> sizes,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean featured,
            ProductSort sort
    ) {
    }
}
