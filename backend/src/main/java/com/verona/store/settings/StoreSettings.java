package com.verona.store.settings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/** The single row of owner-controlled switches (id is always 1). */
@Getter
@Setter
@Entity
@Table(name = "store_settings")
@EntityListeners(AuditingEntityListener.class)
public class StoreSettings {

    public static final short SINGLETON_ID = 1;

    @Id
    private Short id = SINGLETON_ID;

    @Version
    private Long version;

    @LastModifiedDate
    private Instant updatedAt;

    private boolean cashOnDeliveryEnabled = true;

    private boolean cardPaymentsEnabled;

    @Column(length = 160)
    private String orderNotificationEmail;
}
