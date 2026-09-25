package com.verona.store.catalog.storefront;

import com.verona.store.catalog.attribute.Color;
import com.verona.store.catalog.attribute.ColorRepository;
import com.verona.store.catalog.attribute.Size;
import com.verona.store.catalog.attribute.SizeRepository;
import com.verona.store.catalog.category.Category;
import com.verona.store.catalog.category.CategoryRepository;
import com.verona.store.catalog.product.Product;
import com.verona.store.catalog.product.ProductImage;
import com.verona.store.catalog.product.ProductRepository;
import com.verona.store.catalog.product.ProductVariant;
import com.verona.store.catalog.storefront.StorefrontDtos.CategoryView;
import com.verona.store.catalog.storefront.StorefrontDtos.ColorView;
import com.verona.store.catalog.storefront.StorefrontDtos.FiltersView;
import com.verona.store.catalog.storefront.StorefrontDtos.ImageView;
import com.verona.store.catalog.storefront.StorefrontDtos.ProductCard;
import com.verona.store.catalog.storefront.StorefrontDtos.ProductDetail;
import com.verona.store.catalog.storefront.StorefrontDtos.ProductQuery;
import com.verona.store.catalog.storefront.StorefrontDtos.ProductSort;
import com.verona.store.catalog.storefront.StorefrontDtos.SizeView;
import com.verona.store.catalog.storefront.StorefrontDtos.VariantView;
import com.verona.store.shared.exception.NotFoundException;
import com.verona.store.shared.web.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogService {

    private static final int MAX_PAGE_SIZE = 48;

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final ColorRepository colors;
    private final SizeRepository sizes;

    public FiltersView filters() {
        return new FiltersView(
                categories.findAllByActiveTrueOrderBySortOrderAscIdAsc().stream().map(CatalogService::toView).toList(),
                colors.findAllByOrderBySortOrderAscIdAsc().stream().map(CatalogService::toView).toList(),
                sizes.findAllByOrderBySortOrderAscIdAsc().stream().map(CatalogService::toView).toList());
    }

    public PageResponse<ProductCard> search(ProductQuery query, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE), sortOf(query.sort()));
        return PageResponse.of(products.findAll(ProductSpecifications.matching(query), pageable), CatalogService::toCard);
    }

    public ProductDetail product(String slug) {
        Product p = products.findBySlugAndActiveTrue(slug)
                .filter(found -> found.getCategory().isActive())
                .orElseThrow(() -> new NotFoundException("Product", slug));

        List<ProductVariant> variants = p.getVariants();
        List<ColorView> productColors = distinct(variants.stream().map(ProductVariant::getColor).toList()).stream()
                .sorted(Comparator.comparingInt(Color::getSortOrder)).map(CatalogService::toView).toList();
        List<SizeView> productSizes = distinct(variants.stream().map(ProductVariant::getSize).toList()).stream()
                .sorted(Comparator.comparingInt(Size::getSortOrder)).map(CatalogService::toView).toList();

        return new ProductDetail(
                p.getId(), p.getSlug(), p.getName(), p.getDescription(), toView(p.getCategory()),
                p.getBasePrice(), p.getCompareAtPrice(),
                p.getImages().stream().map(i -> new ImageView(i.getUrl(), i.getColor() == null ? null : i.getColor().getId())).toList(),
                productColors, productSizes,
                variants.stream().map(v -> new VariantView(v.getId(), v.getColor().getId(), v.getSize().getId(),
                        v.effectivePrice(), v.getStock())).toList());
    }

    private static Sort sortOf(ProductSort sort) {
        if (sort == null) {
            return Sort.by(Sort.Direction.DESC, "createdAt", "id");
        }
        return switch (sort) {
            case PRICE_ASC -> Sort.by(Sort.Direction.ASC, "basePrice", "id");
            case PRICE_DESC -> Sort.by(Sort.Direction.DESC, "basePrice", "id");
            case NEWEST -> Sort.by(Sort.Direction.DESC, "createdAt", "id");
        };
    }

    private static ProductCard toCard(Product p) {
        List<ProductImage> images = p.getImages();
        BigDecimal price = p.getVariants().stream().map(ProductVariant::effectivePrice)
                .min(Comparator.naturalOrder()).orElse(p.getBasePrice());
        return new ProductCard(
                p.getId(), p.getSlug(), p.getName(), price, p.getCompareAtPrice(),
                images.isEmpty() ? null : images.get(0).getUrl(),
                images.size() > 1 ? images.get(1).getUrl() : null,
                distinct(p.getVariants().stream().map(ProductVariant::getColor).toList()).stream()
                        .sorted(Comparator.comparingInt(Color::getSortOrder)).map(Color::getHexCode).toList(),
                p.getVariants().stream().anyMatch(v -> v.getStock() > 0));
    }

    private static <T extends com.verona.store.shared.domain.BaseEntity> List<T> distinct(List<T> items) {
        var byId = new LinkedHashMap<Long, T>();
        items.stream().filter(Objects::nonNull).forEach(i -> byId.putIfAbsent(i.getId(), i));
        return List.copyOf(byId.values());
    }

    private static CategoryView toView(Category c) {
        return new CategoryView(c.getId(), c.getSlug(), c.getName(), c.getImageUrl(),
                c.getParent() == null ? null : c.getParent().getId());
    }

    private static ColorView toView(Color c) {
        return new ColorView(c.getId(), c.getName(), c.getHexCode());
    }

    private static SizeView toView(Size s) {
        return new SizeView(s.getId(), s.getCode());
    }
}
