package com.verona.store.catalog.product;

import com.verona.store.catalog.category.Category;
import com.verona.store.shared.domain.BaseEntity;
import com.verona.store.shared.domain.LocalizedText;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Aggregate root of the catalog: images and variants are owned children and only change through it.
 */
@Getter
@Setter
@Entity
@Table(name = "products")
public class Product extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String slug;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "ar", column = @Column(name = "name_ar")),
            @AttributeOverride(name = "en", column = @Column(name = "name_en"))
    })
    private LocalizedText name;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "ar", column = @Column(name = "description_ar")),
            @AttributeOverride(name = "en", column = @Column(name = "description_en"))
    })
    private LocalizedText description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(precision = 12, scale = 2)
    private BigDecimal compareAtPrice;

    private boolean active = true;

    private boolean featured;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<ProductVariant> variants = new ArrayList<>();

    public void addImage(ProductImage image) {
        image.setProduct(this);
        images.add(image);
    }

    public void addVariant(ProductVariant variant) {
        variant.setProduct(this);
        variants.add(variant);
    }
}
