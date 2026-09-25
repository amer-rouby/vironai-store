package com.verona.store.catalog.category;

import com.verona.store.catalog.category.CategoryDtos.CategoryRequest;
import com.verona.store.catalog.category.CategoryDtos.CategoryResponse;
import com.verona.store.shared.crud.CrudMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper
public interface CategoryMapper extends CrudMapper<Category, CategoryRequest, CategoryResponse> {

    @Override
    @Mapping(target = "parentId", source = "parent.id")
    CategoryResponse toResponse(Category entity);

    @Override
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "slug", ignore = true)
    void updateEntity(CategoryRequest request, @MappingTarget Category entity);
}
