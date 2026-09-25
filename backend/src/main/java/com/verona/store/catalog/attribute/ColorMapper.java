package com.verona.store.catalog.attribute;

import com.verona.store.catalog.attribute.AttributeDtos.ColorRequest;
import com.verona.store.catalog.attribute.AttributeDtos.ColorResponse;
import com.verona.store.shared.crud.CrudMapper;
import org.mapstruct.Mapper;

@Mapper
public interface ColorMapper extends CrudMapper<Color, ColorRequest, ColorResponse> {
}
