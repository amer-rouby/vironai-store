package com.verona.store.catalog.attribute;

import com.verona.store.shared.crud.BaseRepository;

import java.util.List;

public interface ColorRepository extends BaseRepository<Color> {

    List<Color> findAllByOrderBySortOrderAscIdAsc();
}
