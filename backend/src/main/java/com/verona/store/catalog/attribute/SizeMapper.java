package com.verona.store.catalog.attribute;

import com.verona.store.catalog.attribute.AttributeDtos.SizeRequest;
import com.verona.store.catalog.attribute.AttributeDtos.SizeResponse;
import com.verona.store.shared.crud.CrudMapper;
import org.mapstruct.Mapper;

@Mapper
public interface SizeMapper extends CrudMapper<Size, SizeRequest, SizeResponse> {
}
