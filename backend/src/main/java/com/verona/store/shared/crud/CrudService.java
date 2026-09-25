package com.verona.store.shared.crud;

import com.verona.store.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CrudService<REQ, RES> {

    PageResponse<RES> list(String search, Pageable pageable);

    RES get(Long id);

    RES create(REQ request);

    RES update(Long id, REQ request);

    void delete(Long id);
}
