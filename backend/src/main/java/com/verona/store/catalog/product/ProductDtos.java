package com.verona.store.catalog.product;

import com.verona.store.shared.domain.LocalizedText;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public final class ProductDtos {

    private ProductDtos() {
    }

    public record ProductRequest(
            @NotNull @Valid LocalizedText name,
            @NotNull @Valid LocalizedText description,
            @Size(max = 160) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "lowercase letters, digits and dashes only")
            String slug,
            @NotNull Long categoryId,
            @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal basePrice,
            @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal compareAtPrice,
            boolean active,
            boolean featured,
            @Size(max = 20) List<@Valid ImageRequest> images,
            @Size(max = 200) List<@Valid VariantRequest> variants
    ) {
    }

    public record ImageRequest(@NotBlank @Size(max = 500) String url, Long colorId) {
    }

    public record VariantRequest(
            @NotNull Long colorId,
            @NotNull Long sizeId,
            @Size(max = 60) String sku,
            @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal price,
            @Min(0) int stock,
            /** Version the admin loaded; a sale since then bumps it and the save is rejected instead of overwriting stock. */
            Long version
    ) {
    }

    public record ProductResponse(
            Long id,
            String slug,
            LocalizedText name,
            LocalizedText description,
            Long categoryId,
            BigDecimal basePrice,
            BigDecimal compareAtPrice,
            boolean active,
            boolean featured,
            List<ImageResponse> images,
            List<VariantResponse> variants
    ) {
    }

    public record ImageResponse(Long id, String url, Long colorId, int sortOrder) {
    }

    public record VariantResponse(Long id, Long colorId, Long sizeId, String sku, BigDecimal price, int stock, Long version) {
    }
}
