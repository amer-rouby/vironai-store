package com.verona.store.shared.crud;

import com.verona.store.shared.domain.BaseEntity;
import com.verona.store.shared.exception.NotFoundException;
import com.verona.store.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * Template for admin-managed resources. A concrete service supplies its repository, mapper and entity
 * factory, and overrides the hooks it cares about; list/get/create/update/delete come for free.
 */
public abstract class AbstractCrudService<E extends BaseEntity, REQ, RES> implements CrudService<REQ, RES> {

    protected final BaseRepository<E> repository;
    protected final CrudMapper<E, REQ, RES> mapper;
    private final Supplier<E> factory;
    private final String resourceName;

    protected AbstractCrudService(BaseRepository<E> repository, CrudMapper<E, REQ, RES> mapper,
                                  Supplier<E> factory, String resourceName) {
        this.repository = repository;
        this.mapper = mapper;
        this.factory = factory;
        this.resourceName = resourceName;
    }

    /** Free-text filter used by the admin list; {@code null} means "no filtering". */
    protected Specification<E> searchSpec(String search) {
        return null;
    }

    /** Copies the request onto the entity. Override when relations or children must be resolved. */
    protected void apply(REQ request, E entity) {
        mapper.updateEntity(request, entity);
    }

    /** Invariant checks (uniqueness, cross-field rules) run before every save. */
    protected void validate(REQ request, E entity) {
    }

    protected void beforeDelete(E entity) {
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RES> list(String search, Pageable pageable) {
        Specification<E> spec = StringUtils.hasText(search) ? searchSpec(search.trim()) : null;
        var page = spec == null ? repository.findAll(pageable) : repository.findAll(spec, pageable);
        return PageResponse.of(page, mapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public RES get(Long id) {
        return mapper.toResponse(findOrThrow(id));
    }

    @Override
    @Transactional
    public RES create(REQ request) {
        E entity = factory.get();
        validate(request, entity);
        apply(request, entity);
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public RES update(Long id, REQ request) {
        E entity = findOrThrow(id);
        validate(request, entity);
        apply(request, entity);
        return mapper.toResponse(repository.saveAndFlush(entity));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        E entity = findOrThrow(id);
        beforeDelete(entity);
        repository.delete(entity);
        repository.flush();
    }

    protected E findOrThrow(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException(resourceName, id));
    }

    protected static String likePattern(String search) {
        return "%" + search.toLowerCase().replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
