package com.verona.store.catalog.category;

import com.verona.store.shared.domain.BaseEntity;
import com.verona.store.shared.domain.LocalizedText;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "categories")
public class Category extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String slug;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "ar", column = @Column(name = "name_ar")),
            @AttributeOverride(name = "en", column = @Column(name = "name_en"))
    })
    private LocalizedText name;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    private int sortOrder;

    private boolean active = true;
}
