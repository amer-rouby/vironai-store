package com.verona.store.catalog.attribute;

import com.verona.store.catalog.attribute.AttributeDtos.SizeRequest;
import com.verona.store.catalog.attribute.AttributeDtos.SizeResponse;
import com.verona.store.shared.crud.AbstractCrudController;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/sizes")
@Tag(name = "Admin · Sizes")
public class AdminSizeController extends AbstractCrudController<SizeRequest, SizeResponse> {

    public AdminSizeController(SizeService service) {
        super(service);
    }
}
