package com.verona.store.catalog.product;

import com.verona.store.shared.crud.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends BaseRepository<Product> {

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsByCategoryId(Long categoryId);

    Optional<Product> findBySlugAndActiveTrue(String slug);

    @Query("""
            select count(v) > 0 from ProductVariant v where v.color.id = :colorId
            """)
    boolean existsVariantWithColor(@Param("colorId") Long colorId);

    @Query("""
            select count(i) > 0 from ProductImage i where i.color.id = :colorId
            """)
    boolean existsImageWithColor(@Param("colorId") Long colorId);

    @Query("""
            select count(v) > 0 from ProductVariant v where v.size.id = :sizeId
            """)
    boolean isSizeInUse(@Param("sizeId") Long sizeId);

    @Query("""
            select count(v) > 0 from ProductVariant v where lower(v.sku) = lower(:sku)
              and (:productId is null or v.product.id <> :productId)
            """)
    boolean isSkuTakenByOtherProduct(@Param("sku") String sku, @Param("productId") Long productId);

    default boolean isColorInUse(Long colorId) {
        return existsVariantWithColor(colorId) || existsImageWithColor(colorId);
    }
}
