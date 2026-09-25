package com.verona.store.catalog.product;

import com.verona.store.catalog.product.ProductDtos.ImageResponse;
import com.verona.store.catalog.product.ProductDtos.ProductRequest;
import com.verona.store.catalog.product.ProductDtos.ProductResponse;
import com.verona.store.catalog.product.ProductDtos.VariantResponse;
import com.verona.store.shared.crud.CrudMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper
public interface ProductMapper extends CrudMapper<Product, ProductRequest, ProductResponse> {

    @Override
    @Mapping(target = "categoryId", source = "category.id")
    ProductResponse toResponse(Product entity);

    @Mapping(target = "colorId", source = "color.id")
    ImageResponse toImageResponse(ProductImage image);

    @Mapping(target = "colorId", source = "color.id")
    @Mapping(target = "sizeId", source = "size.id")
    VariantResponse toVariantResponse(ProductVariant variant);

    /** Scalar fields only; relations and children are reconciled by {@link ProductService}. */
    @Override
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "variants", ignore = true)
    void updateEntity(ProductRequest request, @MappingTarget Product entity);
}
