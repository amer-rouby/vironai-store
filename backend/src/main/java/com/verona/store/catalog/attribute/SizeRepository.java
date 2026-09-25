package com.verona.store.catalog.attribute;

import com.verona.store.shared.crud.BaseRepository;

import java.util.List;

public interface SizeRepository extends BaseRepository<Size> {

    List<Size> findAllByOrderBySortOrderAscIdAsc();

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
}
