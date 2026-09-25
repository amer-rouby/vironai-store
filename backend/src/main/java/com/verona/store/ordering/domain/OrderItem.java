package com.verona.store.ordering.domain;

import com.verona.store.catalog.product.ProductVariant;
import com.verona.store.shared.domain.LocalizedText;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * One purchased line, frozen at checkout time. The variant reference is nulled if the variant is later
 * deleted; everything shown to the customer comes from the snapshot columns.
 */
@Getter
@Setter
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @Column(nullable = false, length = 160)
    private String productSlug;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "ar", column = @Column(name = "product_name_ar")),
            @AttributeOverride(name = "en", column = @Column(name = "product_name_en"))
    })
    private LocalizedText productName;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "ar", column = @Column(name = "color_name_ar")),
            @AttributeOverride(name = "en", column = @Column(name = "color_name_en"))
    })
    private LocalizedText colorName;

    @Column(nullable = false, length = 7)
    private String colorHex;

    @Column(nullable = false, length = 20)
    private String sizeCode;

    @Column(nullable = false, length = 60)
    private String sku;

    @Column(length = 500)
    private String imageUrl;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    private int quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}
