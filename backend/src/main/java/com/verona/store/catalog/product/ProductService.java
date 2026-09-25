package com.verona.store.catalog.product;

import com.verona.store.catalog.attribute.Color;
import com.verona.store.catalog.attribute.ColorRepository;
import com.verona.store.catalog.attribute.Size;
import com.verona.store.catalog.attribute.SizeRepository;
import com.verona.store.catalog.category.CategoryRepository;
import com.verona.store.catalog.product.ProductDtos.ImageRequest;
import com.verona.store.catalog.product.ProductDtos.ProductRequest;
import com.verona.store.catalog.product.ProductDtos.ProductResponse;
import com.verona.store.catalog.product.ProductDtos.VariantRequest;
import com.verona.store.shared.crud.AbstractCrudService;
import com.verona.store.shared.exception.BusinessException;
import com.verona.store.shared.exception.NotFoundException;
import com.verona.store.shared.util.Slugs;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ProductService extends AbstractCrudService<Product, ProductRequest, ProductResponse> {

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final ColorRepository colors;
    private final SizeRepository sizes;

    public ProductService(ProductRepository products, ProductMapper mapper, CategoryRepository categories,
                          ColorRepository colors, SizeRepository sizes) {
        super(products, mapper, Product::new, "Product");
        this.products = products;
        this.categories = categories;
        this.colors = colors;
        this.sizes = sizes;
    }

    @Override
    protected Specification<Product> searchSpec(String search) {
        String like = likePattern(search);
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name").get("en")), like),
                cb.like(root.get("name").get("ar"), "%" + search + "%"),
                cb.like(root.get("slug"), like));
    }

    @Override
    protected void validate(ProductRequest request, Product entity) {
        String slug = resolveSlug(request);
        boolean slugTaken = entity.getId() == null
                ? products.existsBySlug(slug)
                : products.existsBySlugAndIdNot(slug, entity.getId());
        if (slugTaken) {
            throw new BusinessException("SLUG_TAKEN", "Slug already in use: " + slug);
        }
        if (request.compareAtPrice() != null && request.compareAtPrice().compareTo(request.basePrice()) <= 0) {
            throw new BusinessException("INVALID_COMPARE_PRICE", "Compare-at price must be greater than the base price",
                    HttpStatus.BAD_REQUEST);
        }

        Set<String> combinations = new HashSet<>();
        Set<String> skus = new HashSet<>();
        for (VariantRequest v : variantsOf(request)) {
            if (!combinations.add(v.colorId() + ":" + v.sizeId())) {
                throw new BusinessException("DUPLICATE_VARIANT", "The same color/size combination appears twice",
                        HttpStatus.BAD_REQUEST);
            }
            if (StringUtils.hasText(v.sku())) {
                String sku = v.sku().trim();
                if (!skus.add(sku.toLowerCase(Locale.ROOT)) || products.isSkuTakenByOtherProduct(sku, entity.getId())) {
                    throw new BusinessException("SKU_TAKEN", "SKU already in use: " + sku);
                }
            }
        }
    }

    @Override
    protected void apply(ProductRequest request, Product product) {
        mapper.updateEntity(request, product);
        product.setSlug(resolveSlug(request));
        product.setCategory(categories.findById(request.categoryId())
                .orElseThrow(() -> new NotFoundException("Category", request.categoryId())));

        List<ImageRequest> imageRequests = request.images() == null ? List.of() : request.images();
        List<VariantRequest> variantRequests = variantsOf(request);

        Set<Long> colorIds = Stream.concat(
                        imageRequests.stream().map(ImageRequest::colorId),
                        variantRequests.stream().map(VariantRequest::colorId))
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> sizeIds = variantRequests.stream().map(VariantRequest::sizeId).collect(Collectors.toSet());
        Map<Long, Color> colorById = load(colorIds, colors.findAllById(colorIds), Color::getId, "Color");
        Map<Long, Size> sizeById = load(sizeIds, sizes.findAllById(sizeIds), Size::getId, "Size");

        replaceImages(product, imageRequests, colorById);
        reconcileVariants(product, variantRequests, colorById, sizeById);
    }

    /** Images carry no history, so the gallery is simply rebuilt in the submitted order. */
    private void replaceImages(Product product, List<ImageRequest> requests, Map<Long, Color> colorById) {
        product.getImages().clear();
        for (int i = 0; i < requests.size(); i++) {
            ImageRequest r = requests.get(i);
            ProductImage image = new ProductImage();
            image.setUrl(r.url().trim());
            image.setColor(r.colorId() == null ? null : colorById.get(r.colorId()));
            image.setSortOrder(i);
            product.addImage(image);
        }
    }

    /**
     * Variants are matched by their color/size combination so existing rows keep their id (orders will
     * reference them); unmatched rows are removed and new combinations are inserted.
     */
    private void reconcileVariants(Product product, List<VariantRequest> requests,
                                   Map<Long, Color> colorById, Map<Long, Size> sizeById) {
        Map<String, ProductVariant> existing = product.getVariants().stream()
                .collect(Collectors.toMap(v -> key(v.getColor().getId(), v.getSize().getId()), Function.identity()));
        Set<String> kept = new HashSet<>();

        for (VariantRequest r : requests) {
            String key = key(r.colorId(), r.sizeId());
            kept.add(key);
            ProductVariant variant = existing.get(key);
            if (variant == null) {
                variant = new ProductVariant();
                variant.setColor(colorById.get(r.colorId()));
                variant.setSize(sizeById.get(r.sizeId()));
                product.addVariant(variant);
            } else if (r.version() != null && !r.version().equals(variant.getVersion())) {
                // Stock moved (an order was placed or cancelled) after the admin opened the form.
                throw new BusinessException("STALE_DATA",
                        "Stock for " + variant.getSku() + " changed since the product was loaded; reload and retry");
            }
            variant.setPrice(r.price());
            variant.setStock(r.stock());
            variant.setSku(StringUtils.hasText(r.sku()) ? r.sku().trim()
                    : generateSku(product.getSlug(), variant.getColor(), variant.getSize()));
        }
        product.getVariants().removeIf(v -> !kept.contains(key(v.getColor().getId(), v.getSize().getId())));
    }

    private static String generateSku(String slug, Color color, Size size) {
        String base = slug.length() > 40 ? slug.substring(0, 40) : slug;
        return (base + "-" + color.getId() + "-" + size.getCode()).toUpperCase(Locale.ROOT);
    }

    private static String key(Long colorId, Long sizeId) {
        return colorId + ":" + sizeId;
    }

    private static List<VariantRequest> variantsOf(ProductRequest request) {
        return request.variants() == null ? List.of() : request.variants();
    }

    private static <T> Map<Long, T> load(Set<Long> requested, Collection<T> found, Function<T, Long> id, String resource) {
        Map<Long, T> map = new HashMap<>();
        found.forEach(item -> map.put(id.apply(item), item));
        requested.stream().filter(requestedId -> !map.containsKey(requestedId)).findFirst()
                .ifPresent(missing -> {
                    throw new NotFoundException(resource, missing);
                });
        return map;
    }

    private static String resolveSlug(ProductRequest request) {
        return StringUtils.hasText(request.slug()) ? request.slug() : Slugs.of(request.name().getEn());
    }
}
