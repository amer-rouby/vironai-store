package com.verona.store.catalog.product;

import com.verona.store.catalog.product.ProductDtos.ProductRequest;
import com.verona.store.catalog.product.ProductDtos.ProductResponse;
import com.verona.store.shared.crud.AbstractCrudController;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/products")
@Tag(name = "Admin · Products")
public class AdminProductController extends AbstractCrudController<ProductRequest, ProductResponse> {

    public AdminProductController(ProductService service) {
        super(service);
    }
}
