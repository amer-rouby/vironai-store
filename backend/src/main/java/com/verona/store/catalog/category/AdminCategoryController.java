package com.verona.store.catalog.category;

import com.verona.store.catalog.category.CategoryDtos.CategoryRequest;
import com.verona.store.catalog.category.CategoryDtos.CategoryResponse;
import com.verona.store.shared.crud.AbstractCrudController;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/categories")
@Tag(name = "Admin · Categories")
public class AdminCategoryController extends AbstractCrudController<CategoryRequest, CategoryResponse> {

    public AdminCategoryController(CategoryService service) {
        super(service);
    }
}
