package com.verona.store.catalog.attribute;

import com.verona.store.shared.domain.BaseEntity;
import com.verona.store.shared.domain.LocalizedText;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "colors")
public class Color extends BaseEntity {

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "ar", column = @Column(name = "name_ar")),
            @AttributeOverride(name = "en", column = @Column(name = "name_en"))
    })
    private LocalizedText name;

    @Column(nullable = false, length = 7)
    private String hexCode;

    private int sortOrder;
}
