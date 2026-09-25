package com.verona.store.catalog.attribute;

import com.verona.store.catalog.attribute.AttributeDtos.ColorRequest;
import com.verona.store.catalog.attribute.AttributeDtos.ColorResponse;
import com.verona.store.shared.crud.AbstractCrudController;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/colors")
@Tag(name = "Admin · Colors")
public class AdminColorController extends AbstractCrudController<ColorRequest, ColorResponse> {

    public AdminColorController(ColorService service) {
        super(service);
    }
}
