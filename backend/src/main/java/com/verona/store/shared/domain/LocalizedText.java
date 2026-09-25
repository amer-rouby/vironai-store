package com.verona.store.shared.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Bilingual text value (Arabic / English). Embedded into entities via {@code @AttributeOverrides}
 * and exposed to clients as {@code {"ar": "...", "en": "..."}}.
 */
@Getter
@Setter
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
public class LocalizedText {

    @NotBlank
    @Size(max = 2000)
    @Column(name = "ar")
    private String ar;

    @NotBlank
    @Size(max = 2000)
    @Column(name = "en")
    private String en;
}
