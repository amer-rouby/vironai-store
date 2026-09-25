package com.verona.store.catalog.category;

import com.verona.store.catalog.category.CategoryDtos.CategoryRequest;
import com.verona.store.catalog.category.CategoryDtos.CategoryResponse;
import com.verona.store.catalog.product.ProductRepository;
import com.verona.store.shared.crud.AbstractCrudService;
import com.verona.store.shared.exception.BusinessException;
import com.verona.store.shared.exception.NotFoundException;
import com.verona.store.shared.util.Slugs;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Objects;

@Service
public class CategoryService extends AbstractCrudService<Category, CategoryRequest, CategoryResponse> {

    private final CategoryRepository categories;
    private final ProductRepository products;

    public CategoryService(CategoryRepository categories, CategoryMapper mapper, ProductRepository products) {
        super(categories, mapper, Category::new, "Category");
        this.categories = categories;
        this.products = products;
    }

    @Override
    protected Specification<Category> searchSpec(String search) {
        String like = likePattern(search);
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name").get("en")), like),
                cb.like(root.get("name").get("ar"), "%" + search + "%"),
                cb.like(root.get("slug"), like));
    }

    @Override
    protected void validate(CategoryRequest request, Category entity) {
        String slug = resolveSlug(request);
        boolean taken = entity.getId() == null
                ? categories.existsBySlug(slug)
                : categories.existsBySlugAndIdNot(slug, entity.getId());
        if (taken) {
            throw new BusinessException("SLUG_TAKEN", "Slug already in use: " + slug);
        }
        if (request.parentId() != null && Objects.equals(request.parentId(), entity.getId())) {
            throw new BusinessException("INVALID_PARENT", "A category cannot be its own parent");
        }
    }

    @Override
    protected void apply(CategoryRequest request, Category entity) {
        mapper.updateEntity(request, entity);
        entity.setSlug(resolveSlug(request));
        entity.setParent(request.parentId() == null ? null
                : categories.findById(request.parentId())
                        .orElseThrow(() -> new NotFoundException("Category", request.parentId())));
    }

    @Override
    protected void beforeDelete(Category entity) {
        if (categories.existsByParentId(entity.getId()) || products.existsByCategoryId(entity.getId())) {
            throw new BusinessException("CATEGORY_IN_USE", "Category still has sub-categories or products");
        }
    }

    private static String resolveSlug(CategoryRequest request) {
        return StringUtils.hasText(request.slug()) ? request.slug() : Slugs.of(request.name().getEn());
    }
}
