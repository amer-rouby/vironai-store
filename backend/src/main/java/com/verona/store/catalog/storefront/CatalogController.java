package com.verona.store.catalog.storefront;

import com.verona.store.catalog.storefront.StorefrontDtos.FiltersView;
import com.verona.store.catalog.storefront.StorefrontDtos.ProductCard;
import com.verona.store.catalog.storefront.StorefrontDtos.ProductDetail;
import com.verona.store.catalog.storefront.StorefrontDtos.ProductQuery;
import com.verona.store.catalog.storefront.StorefrontDtos.ProductSort;
import com.verona.store.shared.web.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/catalog")
@RequiredArgsConstructor
@Tag(name = "Storefront · Catalog")
public class CatalogController {

    private final CatalogService catalog;

    @GetMapping("/filters")
    public FiltersView filters() {
        return catalog.filters();
    }

    @GetMapping("/products")
    public PageResponse<ProductCard> products(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<Long> colors,
            @RequestParam(required = false) List<Long> sizes,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) ProductSort sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return catalog.search(new ProductQuery(category, q, colors, sizes, minPrice, maxPrice, featured, sort), page, size);
    }

    @GetMapping("/products/{slug}")
    public ProductDetail product(@PathVariable String slug) {
        return catalog.product(slug);
    }
}
