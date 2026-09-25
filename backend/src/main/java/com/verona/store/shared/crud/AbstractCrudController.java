package com.verona.store.shared.crud;

import com.verona.store.shared.web.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * REST surface shared by every admin resource. A subclass only declares {@code @RestController},
 * its {@code @RequestMapping} base path and the service it delegates to.
 */
public abstract class AbstractCrudController<REQ, RES> {

    protected final CrudService<REQ, RES> service;

    protected AbstractCrudController(CrudService<REQ, RES> service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<RES> list(@RequestParam(name = "q", required = false) String search,
                                  @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.list(search, pageable);
    }

    @GetMapping("/{id}")
    public RES get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RES create(@Valid @RequestBody REQ request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public RES update(@PathVariable Long id, @Valid @RequestBody REQ request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
