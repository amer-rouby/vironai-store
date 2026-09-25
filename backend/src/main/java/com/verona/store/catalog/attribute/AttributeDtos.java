package com.verona.store.catalog.attribute;

import com.verona.store.shared.domain.LocalizedText;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public final class AttributeDtos {

    private AttributeDtos() {
    }

    public record ColorRequest(
            @NotNull @Valid LocalizedText name,
            @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "must be a hex color like #A0522D") String hexCode,
            int sortOrder
    ) {
    }

    public record ColorResponse(Long id, LocalizedText name, String hexCode, int sortOrder) {
    }

    public record SizeRequest(
            @NotBlank @jakarta.validation.constraints.Size(max = 20) String code,
            int sortOrder
    ) {
    }

    public record SizeResponse(Long id, String code, int sortOrder) {
    }
}
