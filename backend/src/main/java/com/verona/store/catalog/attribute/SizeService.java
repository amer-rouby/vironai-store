package com.verona.store.catalog.attribute;

import com.verona.store.catalog.attribute.AttributeDtos.SizeRequest;
import com.verona.store.catalog.attribute.AttributeDtos.SizeResponse;
import com.verona.store.catalog.product.ProductRepository;
import com.verona.store.shared.crud.AbstractCrudService;
import com.verona.store.shared.exception.BusinessException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class SizeService extends AbstractCrudService<Size, SizeRequest, SizeResponse> {

    private final SizeRepository sizes;
    private final ProductRepository products;

    public SizeService(SizeRepository sizes, SizeMapper mapper, ProductRepository products) {
        super(sizes, mapper, Size::new, "Size");
        this.sizes = sizes;
        this.products = products;
    }

    @Override
    protected Specification<Size> searchSpec(String search) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("code")), likePattern(search));
    }

    @Override
    protected void validate(SizeRequest request, Size entity) {
        String code = request.code().trim();
        boolean taken = entity.getId() == null
                ? sizes.existsByCodeIgnoreCase(code)
                : sizes.existsByCodeIgnoreCaseAndIdNot(code, entity.getId());
        if (taken) {
            throw new BusinessException("SIZE_CODE_TAKEN", "Size code already exists: " + code);
        }
    }

    @Override
    protected void apply(SizeRequest request, Size entity) {
        mapper.updateEntity(request, entity);
        entity.setCode(request.code().trim().toUpperCase());
    }

    @Override
    protected void beforeDelete(Size entity) {
        if (products.isSizeInUse(entity.getId())) {
            throw new BusinessException("SIZE_IN_USE", "Size is used by product variants");
        }
    }
}
