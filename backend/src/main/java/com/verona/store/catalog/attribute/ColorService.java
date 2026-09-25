package com.verona.store.catalog.attribute;

import com.verona.store.catalog.attribute.AttributeDtos.ColorRequest;
import com.verona.store.catalog.attribute.AttributeDtos.ColorResponse;
import com.verona.store.catalog.product.ProductRepository;
import com.verona.store.shared.crud.AbstractCrudService;
import com.verona.store.shared.exception.BusinessException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class ColorService extends AbstractCrudService<Color, ColorRequest, ColorResponse> {

    private final ProductRepository products;

    public ColorService(ColorRepository repository, ColorMapper mapper, ProductRepository products) {
        super(repository, mapper, Color::new, "Color");
        this.products = products;
    }

    @Override
    protected Specification<Color> searchSpec(String search) {
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name").get("en")), likePattern(search)),
                cb.like(root.get("name").get("ar"), "%" + search + "%"));
    }

    @Override
    protected void apply(ColorRequest request, Color entity) {
        mapper.updateEntity(request, entity);
        entity.setHexCode(request.hexCode().toUpperCase());
    }

    @Override
    protected void beforeDelete(Color entity) {
        if (products.isColorInUse(entity.getId())) {
            throw new BusinessException("COLOR_IN_USE", "Color is used by product variants or images");
        }
    }
}
