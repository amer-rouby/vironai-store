package com.verona.store.catalog.storefront;

import com.verona.store.catalog.category.Category;
import com.verona.store.catalog.product.Product;
import com.verona.store.catalog.product.ProductVariant;
import com.verona.store.catalog.storefront.StorefrontDtos.ProductQuery;
import jakarta.persistence.criteria.CommonAbstractCriteria;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Storefront filters composed into a single query. Variant filters use EXISTS sub-queries so a
 * product never appears twice in a page, whatever the number of matching variants.
 */
final class ProductSpecifications {

    private ProductSpecifications() {
    }

    static Specification<Product> matching(ProductQuery q) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Product, Category> category = root.join("category");
            predicates.add(cb.isTrue(root.get("active")));
            predicates.add(cb.isTrue(category.get("active")));

            if (StringUtils.hasText(q.category())) {
                Join<Category, Category> parent = category.join("parent", JoinType.LEFT);
                predicates.add(cb.or(cb.equal(category.get("slug"), q.category()),
                        cb.equal(parent.get("slug"), q.category())));
            }
            if (StringUtils.hasText(q.q())) {
                String term = q.q().trim();
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name").get("en")), "%" + term.toLowerCase() + "%"),
                        cb.like(root.get("name").get("ar"), "%" + term + "%")));
            }
            if (q.minPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("basePrice"), q.minPrice()));
            }
            if (q.maxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("basePrice"), q.maxPrice()));
            }
            if (Boolean.TRUE.equals(q.featured())) {
                predicates.add(cb.isTrue(root.get("featured")));
            }
            if (q.colors() != null && !q.colors().isEmpty()) {
                predicates.add(cb.exists(variantWith(root, query, cb, "color", q.colors())));
            }
            if (q.sizes() != null && !q.sizes().isEmpty()) {
                predicates.add(cb.exists(variantWith(root, query, cb, "size", q.sizes())));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static Subquery<Long> variantWith(Root<Product> product, CommonAbstractCriteria query,
                                              CriteriaBuilder cb, String attribute, List<Long> ids) {
        Subquery<Long> sub = query.subquery(Long.class);
        Root<ProductVariant> variant = sub.from(ProductVariant.class);
        return sub.select(variant.get("id")).where(
                cb.equal(variant.get("product"), product),
                variant.get(attribute).get("id").in(ids));
    }
}
