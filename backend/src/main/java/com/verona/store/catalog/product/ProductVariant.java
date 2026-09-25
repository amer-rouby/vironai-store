package com.verona.store.catalog.product;

import com.verona.store.catalog.attribute.Color;
import com.verona.store.catalog.attribute.Size;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * The sellable unit: one color × one size of a product, with its own SKU and stock.
 */
@Getter
@Setter
@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "color_id")
    private Color color;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "size_id")
    private Size size;

    @Column(nullable = false, unique = true, length = 60)
    private String sku;

    /** Overrides the product base price when set. */
    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    private int stock;

    public BigDecimal effectivePrice() {
        return price != null ? price : product.getBasePrice();
    }
}
