package com.verona.store.catalog.category;

import com.verona.store.shared.crud.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends BaseRepository<Category> {

    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsBySlug(String slug);

    boolean existsByParentId(Long parentId);

    Optional<Category> findBySlugAndActiveTrue(String slug);

    List<Category> findAllByActiveTrueOrderBySortOrderAscIdAsc();
}
