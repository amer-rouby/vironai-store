package com.verona.store.catalog.category;

import com.verona.store.shared.domain.LocalizedText;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class CategoryDtos {

    private CategoryDtos() {
    }

    public record CategoryRequest(
            @NotNull @Valid LocalizedText name,
            @Size(max = 120) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "lowercase letters, digits and dashes only")
            String slug,
            @Size(max = 500) String imageUrl,
            Long parentId,
            int sortOrder,
            boolean active
    ) {
    }

    public record CategoryResponse(
            Long id,
            String slug,
            LocalizedText name,
            String imageUrl,
            Long parentId,
            int sortOrder,
            boolean active
    ) {
    }
}
