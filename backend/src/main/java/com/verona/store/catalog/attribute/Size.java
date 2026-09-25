package com.verona.store.catalog.attribute;

import com.verona.store.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "sizes")
public class Size extends BaseEntity {

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    private int sortOrder;
}
