package com.verona.store.shared.crud;

import org.mapstruct.MappingTarget;

/**
 * Contract every resource mapper fulfils so {@link AbstractCrudService} can map without knowing the types.
 * Concrete MapStruct interfaces only extend this with their generic arguments.
 */
public interface CrudMapper<E, REQ, RES> {

    RES toResponse(E entity);

    void updateEntity(REQ request, @MappingTarget E entity);
}
