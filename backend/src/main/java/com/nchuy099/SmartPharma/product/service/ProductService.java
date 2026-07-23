package com.nchuy099.SmartPharma.product.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.media.domain.enums.UploadType;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.StringUtils;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import com.nchuy099.SmartPharma.media.service.MediaService;
import com.nchuy099.SmartPharma.product.dto.request.CreateProductRequest;
import com.nchuy099.SmartPharma.product.dto.request.CreateProductVariantRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductCategoriesRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductVariantRequest;
import com.nchuy099.SmartPharma.product.dto.response.CategoryResponse;
import com.nchuy099.SmartPharma.product.dto.response.ProductImageUploadUrlResp;
import com.nchuy099.SmartPharma.product.dto.response.ProductListResponse;
import com.nchuy099.SmartPharma.product.dto.response.ProductPageResponse;
import com.nchuy099.SmartPharma.product.dto.response.ProductResponse;
import com.nchuy099.SmartPharma.product.entity.CategoryEntity;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductImageEntity;
import com.nchuy099.SmartPharma.product.entity.ProductIngredientEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.CategoryRepository;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;
import com.nchuy099.SmartPharma.review.repository.ReviewRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductService {

    // JPQL collection parameters cannot be empty, so use a sentinel when category filtering is off.
    private static final UUID NO_CATEGORY_FILTER_SENTINEL = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final InventorySummaryRepository inventorySummaryRepository;
    private final FlashSaleService flashSaleService;
    private final MediaService mediaService;

    public ProductImageUploadUrlResp createProductImageUploadUrl() {
        String userId = "admin";
        var presignedUpload = mediaService.createPreSignedUpload(userId, "", "", null, UploadType.PRODUCT_IMAGE);

        return ProductImageUploadUrlResp.builder()
                .uploadUrl(presignedUpload.getUploadUrl())
                .fileUrl(presignedUpload.getFileUrl())
                .build();
    }

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        log.info("Processing create product request");

        List<CategoryEntity> categories = categoryRepository
                .findAllById(req.getCategoryIds().stream().map(UUID::fromString).toList());

        if (categories.size() != req.getCategoryIds().size()) {
            Set<String> foundIds = categories.stream()
                    .map(cat -> cat.getId().toString())
                    .collect(Collectors.toSet());

            List<String> notFoundIds = req.getCategoryIds().stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();

            throw new AppException(ErrorCode.NOT_FOUND, "Categories not found: " + notFoundIds);
        }

        ProductEntity productEntity = ProductEntity.builder()
                .code(generateProductCode())
                .name(req.getName())
                .webName(req.getWebName())
                .brand(req.getBrand())
                .brandOrigin(req.getBrandOrigin())
                .producer(req.getProducer())
                .description(req.getDescription())
                .careful(normalizePlainText(req.getCareful()))
                .adverseEffect(normalizePlainText(req.getAdverseEffect()))
                .preservation(normalizePlainText(req.getPreservation()))
                .usage(req.getUsage())
                .dosage(req.getDosage())
                .categories(new HashSet<>(categories))
                .build();

        productEntity.setSlug(generateProductSlug(req.getSlug(), req.getName(), productEntity.getCategories()));

        if (req.getVariants() != null) {
            productEntity.setVariants(IntStream.range(0, req.getVariants().size())
                    .mapToObj(index -> {
                        CreateProductRequest.VariantRequest v = req.getVariants().get(index);
                        return ProductVariantEntity.builder()
                                .sku(resolveRequestedSku(v.getSku(), productEntity.getCode(), index + 1))
                                .unitType(resolveUnitType(v))
                                .specification(normalizePlainText(v.getSpecification()))
                                .salePrice(v.getSalePrice())
                                .discountPercent(v.getDiscountPercent() != null ? v.getDiscountPercent() : java.math.BigDecimal.ZERO)
                                .isDefault(v.getIsDefault())
                                .isActive(v.getIsActive() != null ? v.getIsActive() : true)
                                .product(productEntity)
                                .build();
                    })
                    .collect(Collectors.toList()));
        }

        if (req.getIngredient() != null) {
            productEntity.setIngredient(req.getIngredient().stream()
                    .map(i -> ProductIngredientEntity.builder()
                            .ingredientId(i.getIngredientId())
                            .name(i.getName())
                            .shortDescription(i.getShortDescription())
                            .product(productEntity)
                            .build())
                    .collect(Collectors.toList()));
        }

        productEntity.setImages(buildProductImages(req.getPrimaryImage(), req.getSecondaryImages(), productEntity));

        productRepository.save(productEntity);
        if (productEntity.getVariants() != null) {
            productEntity.getVariants().forEach(variant -> ensureInventorySummary(variant.getId()));
        }

        return mapToProductResponse(
                productEntity,
                productEntity.getVariants(),
                productEntity.getImages(),
                productEntity.getIngredient());
    }

    @Transactional
    public List<ProductResponse> createBatch(List<CreateProductRequest> requests) {
        log.info("Processing batch create product request with {} items", requests.size());
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        Set<UUID> allCategoryIds = requests.stream()
                .filter(req -> req.getCategoryIds() != null)
                .flatMap(req -> req.getCategoryIds().stream())
                .map(UUID::fromString)
                .collect(Collectors.toSet());

        Map<UUID, CategoryEntity> categoryById = categoryRepository.findAllById(allCategoryIds).stream()
                .collect(Collectors.toMap(CategoryEntity::getId, c -> c));

        List<ProductEntity> toSave = new ArrayList<>(requests.size());
        for (CreateProductRequest req : requests) {
            if (req.getCategoryIds() == null || req.getCategoryIds().isEmpty()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Category ids must not be empty");
            }

            List<CategoryEntity> categories = req.getCategoryIds().stream()
                    .map(UUID::fromString)
                    .map(categoryById::get)
                    .filter(java.util.Objects::nonNull)
                    .toList();

            if (categories.size() != req.getCategoryIds().size()) {
                Set<String> foundIds = categories.stream()
                        .map(cat -> cat.getId().toString())
                        .collect(Collectors.toSet());
                List<String> notFoundIds = req.getCategoryIds().stream()
                        .filter(id -> !foundIds.contains(id))
                        .toList();
                throw new AppException(ErrorCode.NOT_FOUND, "Categories not found: " + notFoundIds);
            }

            ProductEntity productEntity = ProductEntity.builder()
                    .code(generateProductCode())
                    .name(req.getName())
                    .webName(req.getWebName())
                    .brand(req.getBrand())
                    .brandOrigin(req.getBrandOrigin())
                    .producer(req.getProducer())
                    .description(req.getDescription())
                    .careful(normalizePlainText(req.getCareful()))
                    .adverseEffect(normalizePlainText(req.getAdverseEffect()))
                    .preservation(normalizePlainText(req.getPreservation()))
                    .usage(req.getUsage())
                    .dosage(req.getDosage())
                    .categories(new HashSet<>(categories))
                    .build();

            productEntity.setSlug(generateProductSlug(req.getSlug(), req.getName(), productEntity.getCategories()));

            if (req.getVariants() != null) {
                productEntity.setVariants(IntStream.range(0, req.getVariants().size())
                        .mapToObj(index -> {
                            CreateProductRequest.VariantRequest v = req.getVariants().get(index);
                            return ProductVariantEntity.builder()
                                    .sku(resolveRequestedSku(v.getSku(), productEntity.getCode(), index + 1))
                                    .unitType(resolveUnitType(v))
                                    .specification(normalizePlainText(v.getSpecification()))
                                    .salePrice(v.getSalePrice())
                                    .discountPercent(v.getDiscountPercent() != null ? v.getDiscountPercent() : java.math.BigDecimal.ZERO)
                                    .isDefault(v.getIsDefault())
                                    .isActive(v.getIsActive() != null ? v.getIsActive() : true)
                                    .product(productEntity)
                                    .build();
                        })
                        .collect(Collectors.toList()));
            }

            if (req.getIngredient() != null) {
                productEntity.setIngredient(req.getIngredient().stream()
                        .map(i -> ProductIngredientEntity.builder()
                                .ingredientId(i.getIngredientId())
                                .name(i.getName())
                                .shortDescription(i.getShortDescription())
                                .product(productEntity)
                                .build())
                        .collect(Collectors.toList()));
            }

            productEntity.setImages(buildProductImages(req.getPrimaryImage(), req.getSecondaryImages(), productEntity));
            toSave.add(productEntity);
        }

        List<ProductEntity> saved = productRepository.saveAll(toSave);
        for (ProductEntity product : saved) {
            if (product.getVariants() != null) {
                product.getVariants().forEach(variant -> ensureInventorySummary(variant.getId()));
            }
        }

        return saved.stream().map(this::mapToProductResponseWithoutStats).toList();
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest req) {
        log.info("Processing update product request with id: {}", id);

        ProductEntity productEntity = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found with id: " + id));

        if (!org.springframework.util.StringUtils.hasText(productEntity.getCode())) {
            productEntity.setCode(generateProductCode());
        }

        if (req.getName() != null)
            productEntity.setName(req.getName());

        if (req.getName() != null || req.getSlug() != null || req.getCategoryIds() != null) {
            String requestedSlug = req.getSlug() != null ? req.getSlug() : productEntity.getSlug();
            Set<CategoryEntity> targetCategories = productEntity.getCategories();
            if (req.getCategoryIds() != null) {
                targetCategories = new HashSet<>(categoryRepository.findAllById(req.getCategoryIds().stream().map(UUID::fromString).toList()));
            }
            productEntity.setSlug(generateProductSlug(requestedSlug, productEntity.getName(), targetCategories));
        }

        if (req.getWebName() != null)
            productEntity.setWebName(req.getWebName());
        if (req.getBrand() != null)
            productEntity.setBrand(req.getBrand());
        if (req.getBrandOrigin() != null)
            productEntity.setBrandOrigin(req.getBrandOrigin());
        if (req.getProducer() != null)
            productEntity.setProducer(req.getProducer());
        if (req.getDescription() != null)
            productEntity.setDescription(req.getDescription());
        if (req.getCareful() != null)
            productEntity.setCareful(normalizePlainText(req.getCareful()));
        if (req.getAdverseEffect() != null)
            productEntity.setAdverseEffect(normalizePlainText(req.getAdverseEffect()));
        if (req.getPreservation() != null)
            productEntity.setPreservation(normalizePlainText(req.getPreservation()));
        if (req.getUsage() != null)
            productEntity.setUsage(req.getUsage());
        if (req.getDosage() != null)
            productEntity.setDosage(req.getDosage());

        if (req.getVariants() != null) {
            upsertVariants(productEntity, req.getVariants());
        }

        if (req.getIngredient() != null) {
            productEntity.getIngredient().clear();
            productEntity.getIngredient().addAll(req.getIngredient().stream()
                    .map(i -> ProductIngredientEntity.builder()
                            .ingredientId(i.getIngredientId())
                            .name(i.getName())
                            .shortDescription(i.getShortDescription())
                            .product(productEntity)
                            .build())
                    .toList());
        }

        if (req.getPrimaryImage() != null || req.getSecondaryImages() != null) {
            String primaryImage = req.getPrimaryImage();
            List<String> secondaryImages = req.getSecondaryImages();
            if (primaryImage == null) {
                primaryImage = resolvePrimaryImage(productEntity);
            }
            if (secondaryImages == null) {
                secondaryImages = resolveSecondaryImages(productEntity);
            }

            productEntity.getImages().clear();
            productEntity.getImages().addAll(buildProductImages(primaryImage, secondaryImages, productEntity));
        }

        if (req.getCategoryIds() != null && !req.getCategoryIds().isEmpty()) {
            List<CategoryEntity> categories = categoryRepository.findAllById(req.getCategoryIds().stream().map(UUID::fromString).toList());
            if (categories.size() != req.getCategoryIds().size()) {
                Set<String> foundIds = categories.stream().map(cat -> cat.getId().toString()).collect(Collectors.toSet());
                List<String> notFoundIds = req.getCategoryIds().stream().filter(catId -> !foundIds.contains(catId)).toList();
                throw new AppException(ErrorCode.NOT_FOUND, "Categories not found: " + notFoundIds);
            }
            productEntity.getCategories().clear();
            productEntity.getCategories().addAll(new HashSet<>(categories));
        }

        productRepository.save(productEntity);
        if (productEntity.getVariants() != null) {
            productEntity.getVariants().forEach(variant -> ensureInventorySummary(variant.getId()));
        }
        return mapToProductResponse(
                productEntity,
                productEntity.getVariants(),
                productEntity.getImages(),
                productEntity.getIngredient());
    }

    @Transactional
    public ProductResponse updateCategories(UUID productId, UpdateProductCategoriesRequest req) {
        ProductEntity productEntity = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found with id: " + productId));

        if (req.getCategoryIds() == null || req.getCategoryIds().isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Category ids must not be empty");
        }

        List<CategoryEntity> categories = categoryRepository.findAllById(req.getCategoryIds().stream().map(UUID::fromString).toList());
        if (categories.size() != req.getCategoryIds().size()) {
            Set<String> foundIds = categories.stream().map(cat -> cat.getId().toString()).collect(Collectors.toSet());
            List<String> notFoundIds = req.getCategoryIds().stream().filter(catId -> !foundIds.contains(catId)).toList();
            throw new AppException(ErrorCode.NOT_FOUND, "Categories not found: " + notFoundIds);
        }

        productEntity.getCategories().clear();
        productEntity.getCategories().addAll(new HashSet<>(categories));

        productRepository.save(productEntity);
        return mapToProductResponse(
                productEntity,
                productEntity.getVariants(),
                productEntity.getImages(),
                productEntity.getIngredient());
    }

    @Transactional
    public List<ProductResponse.VariantResponse> getVariants(UUID productId) {
        if (!productRepository.existsById(productId)) {
            throw new AppException(ErrorCode.NOT_FOUND, "Product not found with id: " + productId);
        }

        return loadVariantsByProductIds(List.of(productId)).getOrDefault(productId, List.of()).stream()
                .map(this::mapToVariantResponse)
                .toList();
    }

    @Transactional
    public ProductResponse.VariantResponse createVariant(UUID productId, CreateProductVariantRequest req) {
        ProductEntity productEntity = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found with id: " + productId));

        if (!org.springframework.util.StringUtils.hasText(productEntity.getCode())) {
            productEntity.setCode(generateProductCode());
        }

        Set<String> usedSkus = productEntity.getVariants().stream()
                .map(ProductVariantEntity::getSku)
                .filter(org.springframework.util.StringUtils::hasText)
                .collect(Collectors.toSet());

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .product(productEntity)
                .sku(resolveRequestedSku(req.getSku(), productEntity.getCode(), usedSkus))
                .unitType(resolveUnitType(req.getUnitType(), req.getUnit()))
                .specification(normalizePlainText(req.getSpecification()))
                .salePrice(req.getSalePrice())
                .discountPercent(req.getDiscountPercent() != null ? req.getDiscountPercent() : java.math.BigDecimal.ZERO)
                .isDefault(Boolean.TRUE.equals(req.getIsDefault()))
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        if (Boolean.TRUE.equals(variant.getIsDefault())) {
            productEntity.getVariants().forEach(v -> v.setIsDefault(false));
        }
        productEntity.getVariants().add(variant);
        ensureOneDefaultActiveVariant(productEntity.getVariants());

        ProductVariantEntity saved = productVariantRepository.save(variant);
        ensureInventorySummary(saved.getId());
        return mapToVariantResponse(saved);
    }

    @Transactional
    public ProductResponse.VariantResponse updateVariant(UUID productId, UUID variantId, UpdateProductVariantRequest req) {
        ProductVariantEntity variant = productVariantRepository.findByIdWithProduct(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Variant not found with id: " + variantId));

        if (!variant.getProduct().getId().equals(productId)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Variant does not belong to product");
        }

        if (org.springframework.util.StringUtils.hasText(req.getUnitType()) || org.springframework.util.StringUtils.hasText(req.getUnit())) {
            variant.setUnitType(resolveUnitType(req.getUnitType(), req.getUnit()));
        }
        if (org.springframework.util.StringUtils.hasText(req.getSku())) {
            variant.setSku(normalizeSku(req.getSku()));
        }
        if (req.getSpecification() != null) {
            variant.setSpecification(normalizePlainText(req.getSpecification()));
        }
        if (req.getSalePrice() != null) {
            variant.setSalePrice(req.getSalePrice());
        }
        if (req.getDiscountPercent() != null) {
            variant.setDiscountPercent(req.getDiscountPercent());
        }
        if (req.getIsActive() != null) {
            variant.setIsActive(req.getIsActive());
        }
        if (req.getIsDefault() != null) {
            if (Boolean.TRUE.equals(req.getIsDefault())) {
                variant.getProduct().getVariants().forEach(v -> v.setIsDefault(false));
                variant.setIsDefault(true);
            } else {
                variant.setIsDefault(false);
            }
        }

        ensureOneDefaultActiveVariant(variant.getProduct().getVariants());
        ProductVariantEntity saved = productVariantRepository.save(variant);
        return mapToVariantResponse(saved);
    }

    @Transactional
    public void deleteVariant(UUID productId, UUID variantId) {
        ProductVariantEntity variant = productVariantRepository.findByIdWithProduct(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Variant not found with id: " + variantId));

        if (!variant.getProduct().getId().equals(productId)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Variant does not belong to product");
        }

        variant.setIsActive(false);
        variant.setIsDefault(false);
        ensureOneDefaultActiveVariant(variant.getProduct().getVariants());
        productVariantRepository.save(variant);
    }

    public void delete(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new AppException(ErrorCode.NOT_FOUND, "Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    @Transactional
    public ProductResponse getDetails(UUID id) {
        ProductEntity productEntity = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found with id: " + id));
        return mapToProductResponse(productEntity,
                loadVariantsByProductIds(List.of(id)).getOrDefault(id, List.of()),
                loadImagesByProductIds(List.of(id)).getOrDefault(id, List.of()),
                loadIngredientsByProductIds(List.of(id)).getOrDefault(id, List.of()));
    }

    @Transactional
    public ProductResponse getDetailsBySlug(String slug) {
        ProductEntity productEntity = productRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found with slug: " + slug));
        UUID productId = productEntity.getId();
        return mapToProductResponse(productEntity,
                loadVariantsByProductIds(List.of(productId)).getOrDefault(productId, List.of()),
                loadImagesByProductIds(List.of(productId)).getOrDefault(productId, List.of()),
                loadIngredientsByProductIds(List.of(productId)).getOrDefault(productId, List.of()));
    }

    @Transactional
    public ProductResponse getDetailsBySku(String sku) {
        ProductEntity productEntity = productRepository.findBySku(sku)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found with sku: " + sku));
        UUID productId = productEntity.getId();
        return mapToProductResponse(productEntity,
                loadVariantsByProductIds(List.of(productId)).getOrDefault(productId, List.of()),
                loadImagesByProductIds(List.of(productId)).getOrDefault(productId, List.of()),
                loadIngredientsByProductIds(List.of(productId)).getOrDefault(productId, List.of()));
    }

    @Transactional
    public ProductPageResponse getList(int page, int size, String categorySlug, String search, String sortBy,
            java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, boolean includeStats) {
        return getListByProductIds(page, size, categorySlug, search, sortBy, minPrice, maxPrice, includeStats);
    }

    @Transactional
    public ProductPageResponse getListByProductIds(int page, int size, String categorySlug, String search, String sortBy,
            java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, boolean includeStats) {
        if (page > 0) {
            page--;
        }

        Pageable pageable = PageRequest.of(page, size);
        String normalizedCategorySlug = normalizeFilter(categorySlug);
        String normalizedSearch = normalizeFilter(search);

        List<UUID> categoryIds = List.of(NO_CATEGORY_FILTER_SENTINEL);
        boolean hasCategoryFilter = false;

        if (normalizedCategorySlug != null) {
            CategoryEntity rootCategory = categoryRepository.findBySlug(normalizedCategorySlug)
                    .orElse(null);
            if (rootCategory == null) {
                return emptyProductPage(pageable);
            }

            List<UUID> resolvedCategoryIds = categoryRepository.findDescendantIds(rootCategory.getId());
            if (resolvedCategoryIds == null || resolvedCategoryIds.isEmpty()) {
                return emptyProductPage(pageable);
            }

            categoryIds = resolvedCategoryIds;
            hasCategoryFilter = true;
        }

        Page<UUID> productIdsPage = findProductIds(pageable, categoryIds, hasCategoryFilter, normalizedSearch, sortBy, minPrice, maxPrice);
        if (productIdsPage.isEmpty()) {
            return ProductPageResponse.builder()
                    .products(List.of())
                    .pagination(Pagination.builder()
                            .page(productIdsPage.getNumber() + 1)
                            .size(productIdsPage.getSize())
                            .totalPages(productIdsPage.getTotalPages())
                            .totalElements(productIdsPage.getTotalElements())
                            .build())
                    .build();
        }

        List<UUID> productIds = productIdsPage.getContent();
        Map<UUID, ProductEntity> productById = productRepository.findByIdInWithBaseDetails(productIds).stream()
                .collect(Collectors.toMap(ProductEntity::getId, Function.identity(), (left, right) -> left, LinkedHashMap::new));
        Map<UUID, List<ProductVariantEntity>> variantsByProductId = loadVariantsByProductIds(productIds);
        Map<UUID, List<ProductImageEntity>> imagesByProductId = loadImagesByProductIds(productIds);
        Map<UUID, ProductRepository.ProductReviewStatsProjection> reviewStatsByProductId = includeStats
                ? loadReviewStats(productIds)
                : Map.of();

        List<ProductListResponse> products = productIds.stream()
                .map(productById::get)
                .filter(Objects::nonNull)
                .map(product -> mapToProductListResponse(
                        product,
                        variantsByProductId.getOrDefault(product.getId(), List.of()),
                        resolvePrimaryImage(imagesByProductId.getOrDefault(product.getId(), List.of())),
                        reviewStatsByProductId,
                        includeStats))
                .toList();

        return ProductPageResponse.builder()
                .products(products)
                .pagination(Pagination.builder()
                        .page(productIdsPage.getNumber() + 1)
                        .size(productIdsPage.getSize())
                        .totalPages(productIdsPage.getTotalPages())
                        .totalElements(productIdsPage.getTotalElements())
                        .build())
                .build();
    }

    private Page<UUID> findProductIds(Pageable pageable, List<UUID> categoryIds, boolean hasCategoryFilter,
            String search, String sortBy, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        String normalizedSortBy = normalizeFilter(sortBy);
        return switch (normalizedSortBy != null ? normalizedSortBy : "default") {
            case "price-low" -> productRepository.findListProductIdsPriceLow(categoryIds, hasCategoryFilter, search, minPrice, maxPrice, pageable);
            case "price-high" -> productRepository.findListProductIdsPriceHigh(categoryIds, hasCategoryFilter, search, minPrice, maxPrice, pageable);
            default -> productRepository.findListProductIdsDefault(categoryIds, hasCategoryFilter, search, minPrice, maxPrice, pageable);
        };
    }

    private Map<UUID, ProductRepository.ProductReviewStatsProjection> loadReviewStats(List<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }

        return productRepository.findReviewStatsByProductIds(productIds).stream()
                .filter(row -> row.getProductId() != null)
                .collect(Collectors.toMap(
                        ProductRepository.ProductReviewStatsProjection::getProductId,
                        Function.identity(),
                        (left, right) -> left,
                        LinkedHashMap::new));
    }

    private ProductPageResponse emptyProductPage(Pageable pageable) {
        return ProductPageResponse.builder()
                .products(List.of())
                .pagination(Pagination.builder()
                        .page(pageable.getPageNumber() + 1)
                        .size(pageable.getPageSize())
                        .totalPages(0)
                        .totalElements(0)
                        .build())
                .build();
    }

    private ProductListResponse mapToProductListResponse(ProductEntity product,
            List<ProductVariantEntity> variants,
            String primaryImage,
            Map<UUID, ProductRepository.ProductReviewStatsProjection> reviewStatsByProductId,
            boolean includeStats) {
        ProductRepository.ProductReviewStatsProjection stats = reviewStatsByProductId.get(product.getId());
        Double averageRating = includeStats && stats != null && stats.getAverageRating() != null
                ? Math.round(stats.getAverageRating() * 10.0) / 10.0
                : 0.0;
        Long totalReviews = includeStats && stats != null && stats.getTotalReviews() != null
                ? stats.getTotalReviews()
                : 0L;
        Map<UUID, ProductResponse.FlashSaleSummaryResponse> flashSaleByVariantId = loadFlashSaleSummaries(variants);

        return ProductListResponse.builder()
                .id(product.getId().toString())
                .code(product.getCode())
                .slug(product.getSlug())
                .name(product.getName())
                .webName(product.getWebName())
                .primaryImage(primaryImage)
                .variants(variants.stream()
                        .map(v -> ProductListResponse.VariantResponse.builder()
                                .id(v.getId() != null ? v.getId().toString() : null)
                                .sku(v.getSku())
                                .unitType(v.getUnitType())
                                .specification(v.getSpecification())
                                .salePrice(v.getSalePrice())
                                .discountPercent(v.getDiscountPercent() != null ? v.getDiscountPercent() : java.math.BigDecimal.ZERO)
                                .isDefault(v.getIsDefault())
                                .quantityAvailable(v.getInventory() != null ? v.getInventory().getQuantityAvailable() : 0)
                                .flashSale(v.getId() != null && flashSaleByVariantId.get(v.getId()) != null
                                        ? toProductListFlashSale(flashSaleByVariantId.get(v.getId()))
                                        : null)
                                .build())
                        .toList())
                .quantityAvailable(variants.stream().mapToInt(v -> v.getInventory() != null ? v.getInventory().getQuantityAvailable() : 0).sum())
                .categories(product.getCategories().stream()
                        .map(cat -> CategoryResponse.builder().id(cat.getId().toString()).slug(cat.getSlug()).name(cat.getName()).build())
                        .toList())
                .averageRating(averageRating)
                .totalReviews(totalReviews)
                .build();
    }

    private String normalizeFilter(String value) {
        return (value != null && !value.trim().isEmpty()) ? value.trim() : null;
    }

    private ProductResponse mapToProductResponse(ProductEntity product) {
        return mapToProductResponse(product, product.getVariants(), product.getImages(), product.getIngredient());
    }

    private ProductResponse mapToProductResponse(ProductEntity product,
            List<ProductVariantEntity> variants,
            List<ProductImageEntity> images,
            List<ProductIngredientEntity> ingredients) {
        Map<UUID, ProductResponse.FlashSaleSummaryResponse> flashSaleByVariantId = loadFlashSaleSummaries(variants);
        return ProductResponse.builder()
                .id(product.getId().toString())
                .code(product.getCode())
                .slug(product.getSlug())
                .name(product.getName())
                .webName(product.getWebName())
                .primaryImage(resolvePrimaryImage(images))
                .secondaryImages(resolveSecondaryImages(images))
                .brand(product.getBrand())
                .brandOrigin(product.getBrandOrigin())
                .producer(product.getProducer())
                .description(product.getDescription())
                .careful(product.getCareful())
                .adverseEffect(product.getAdverseEffect())
                .preservation(product.getPreservation())
                .variants(variants.stream()
                        .map(v -> mapToVariantResponse(v, v.getId() != null ? flashSaleByVariantId.get(v.getId()) : null))
                        .toList())
                .ingredient(ingredients.stream()
                        .map(i -> ProductResponse.IngredientResponse.builder()
                                .ingredientId(i.getIngredientId())
                                .name(i.getName())
                                .shortDescription(i.getShortDescription())
                                .build())
                        .toList())
                .usage(product.getUsage())
                .dosage(product.getDosage())
                .categories(product.getCategories().stream().map(cat -> CategoryResponse.builder().id(cat.getId().toString()).slug(cat.getSlug()).name(cat.getName()).build()).toList())
                .quantityAvailable(variants.stream().mapToInt(v -> v.getInventory() != null ? v.getInventory().getQuantityAvailable() : 0).sum())
                .quantityOnHand(variants.stream().mapToInt(v -> v.getInventory() != null ? v.getInventory().getQuantityOnHand() : 0).sum())
                .isActive(product.getIsActive())
                .averageRating(getAverageRating(product.getId()))
                .totalReviews(reviewRepository.countByProductId(product.getId()))
                .build();
    }

    private ProductResponse mapToProductResponseWithoutStats(ProductEntity product) {
        return mapToProductResponse(
                product,
                product.getVariants(),
                product.getImages(),
                product.getIngredient());
    }

    private Double getAverageRating(UUID productId) {
        Double avg = reviewRepository.findAverageRatingByProductId(productId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    private String generateProductSlug(String requestedSlug, String name, Set<CategoryEntity> categories) {
        return StringUtils.toSlug(name);
    }

    private String generateProductCode() {
        for (int attempt = 0; attempt < 2000; attempt++) {
            String code = "PRO" + String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
            if (!productRepository.existsByCode(code)) {
                return code;
            }
        }
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Unable to generate unique product code");
    }

    private String generateVariantSku(String productCode, int sequence) {
        if (sequence < 1 || sequence > 999) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Variant count exceeds 999 for one product");
        }
        return productCode + String.format("%03d", sequence);
    }

    private String generateNextVariantSku(String productCode, Set<String> usedSkus) {
        for (int sequence = 1; sequence <= 999; sequence++) {
            String candidate = generateVariantSku(productCode, sequence);
            if (!usedSkus.contains(candidate)) {
                return candidate;
            }
        }
        throw new AppException(ErrorCode.BAD_REQUEST, "Variant count exceeds 999 for one product");
    }

    private String resolveRequestedSku(String requestedSku, String productCode, int sequence) {
        if (org.springframework.util.StringUtils.hasText(requestedSku)) {
            return normalizeSku(requestedSku);
        }
        return generateVariantSku(productCode, sequence);
    }

    private String resolveRequestedSku(String requestedSku, String productCode, Set<String> usedSkus) {
        if (org.springframework.util.StringUtils.hasText(requestedSku)) {
            return normalizeSku(requestedSku);
        }
        return generateNextVariantSku(productCode, usedSkus);
    }

    private String normalizeSku(String sku) {
        return sku.trim().toUpperCase(java.util.Locale.ROOT);
    }

    private void upsertVariants(ProductEntity productEntity, List<CreateProductRequest.VariantRequest> requestedVariants) {
        List<ProductVariantEntity> existingVariants = productEntity.getVariants();
        Map<UUID, ProductVariantEntity> existingById = new HashMap<>();
        for (ProductVariantEntity existingVariant : existingVariants) {
            if (existingVariant.getId() != null) {
                existingById.put(existingVariant.getId(), existingVariant);
            }
        }

        Set<String> usedSkus = existingVariants.stream()
                .map(ProductVariantEntity::getSku)
                .filter(org.springframework.util.StringUtils::hasText)
                .collect(Collectors.toSet());
        Set<UUID> touchedExistingVariantIds = new HashSet<>();
        int nextUntouchedExistingIndex = 0;

        for (CreateProductRequest.VariantRequest requestedVariant : requestedVariants) {
            ProductVariantEntity targetVariant = null;

            if (org.springframework.util.StringUtils.hasText(requestedVariant.getId())) {
                UUID variantId;
                try {
                    variantId = UUID.fromString(requestedVariant.getId().trim());
                } catch (IllegalArgumentException e) {
                    throw new AppException(ErrorCode.BAD_REQUEST, "Invalid variant id: " + requestedVariant.getId());
                }
                targetVariant = existingById.get(variantId);
                if (targetVariant == null) {
                    throw new AppException(ErrorCode.BAD_REQUEST, "Variant not found with id: " + requestedVariant.getId());
                }
                touchedExistingVariantIds.add(variantId);
            } else {
                while (nextUntouchedExistingIndex < existingVariants.size()
                        && existingVariants.get(nextUntouchedExistingIndex).getId() != null
                        && touchedExistingVariantIds.contains(existingVariants.get(nextUntouchedExistingIndex).getId())) {
                    nextUntouchedExistingIndex++;
                }

                if (nextUntouchedExistingIndex < existingVariants.size()) {
                    targetVariant = existingVariants.get(nextUntouchedExistingIndex++);
                    if (targetVariant.getId() != null) {
                        touchedExistingVariantIds.add(targetVariant.getId());
                    }
                } else {
                    targetVariant = ProductVariantEntity.builder()
                            .sku(resolveRequestedSku(requestedVariant.getSku(), productEntity.getCode(), usedSkus))
                            .product(productEntity)
                            .build();
                    existingVariants.add(targetVariant);
                    usedSkus.add(targetVariant.getSku());
                }
            }

            if (org.springframework.util.StringUtils.hasText(requestedVariant.getSku())) {
                targetVariant.setSku(normalizeSku(requestedVariant.getSku()));
            }
            targetVariant.setUnitType(resolveUnitType(requestedVariant));
            targetVariant.setSpecification(normalizePlainText(requestedVariant.getSpecification()));
            targetVariant.setSalePrice(requestedVariant.getSalePrice());
            targetVariant.setDiscountPercent(requestedVariant.getDiscountPercent() != null ? requestedVariant.getDiscountPercent() : java.math.BigDecimal.ZERO);
            targetVariant.setIsDefault(Boolean.TRUE.equals(requestedVariant.getIsDefault()));
            targetVariant.setIsActive(requestedVariant.getIsActive() != null ? requestedVariant.getIsActive() : true);
            targetVariant.setProduct(productEntity);
        }

        for (ProductVariantEntity existingVariant : existingVariants) {
            if (existingVariant.getId() != null && !touchedExistingVariantIds.contains(existingVariant.getId())) {
                existingVariant.setIsActive(false);
                existingVariant.setIsDefault(false);
            }
        }

        if (existingVariants.stream().noneMatch(v -> Boolean.TRUE.equals(v.getIsDefault()) && Boolean.TRUE.equals(v.getIsActive()))) {
            existingVariants.stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                    .findFirst()
                    .ifPresent(v -> v.setIsDefault(true));
        }
    }

    private String resolveUnitType(CreateProductRequest.VariantRequest variantRequest) {
        if (org.springframework.util.StringUtils.hasText(variantRequest.getUnitType())) {
            return variantRequest.getUnitType().trim();
        }
        if (org.springframework.util.StringUtils.hasText(variantRequest.getUnit())) {
            return variantRequest.getUnit().trim();
        }
        throw new AppException(ErrorCode.BAD_REQUEST, "Variant unitType is required");
    }

    private String resolveUnitType(String unitType, String unit) {
        if (org.springframework.util.StringUtils.hasText(unitType)) {
            return unitType.trim();
        }
        if (org.springframework.util.StringUtils.hasText(unit)) {
            return unit.trim();
        }
        throw new AppException(ErrorCode.BAD_REQUEST, "Variant unitType is required");
    }

    private ProductResponse.VariantResponse mapToVariantResponse(ProductVariantEntity v) {
        return mapToVariantResponse(v, null);
    }

    private ProductResponse.VariantResponse mapToVariantResponse(ProductVariantEntity v, ProductResponse.FlashSaleSummaryResponse flashSale) {
        return ProductResponse.VariantResponse.builder()
                .id(v.getId() != null ? v.getId().toString() : null)
                .sku(v.getSku())
                .unitType(v.getUnitType())
                .specification(v.getSpecification())
                .salePrice(v.getSalePrice())
                .discountPercent(v.getDiscountPercent() != null ? v.getDiscountPercent() : java.math.BigDecimal.ZERO)
                .isDefault(v.getIsDefault())
                .isActive(v.getIsActive())
                .quantityAvailable(v.getInventory() != null ? v.getInventory().getQuantityAvailable() : 0)
                .quantityOnHand(v.getInventory() != null ? v.getInventory().getQuantityOnHand() : 0)
                .flashSale(flashSale)
                .build();
    }

    private Map<UUID, ProductResponse.FlashSaleSummaryResponse> loadFlashSaleSummaries(List<ProductVariantEntity> variants) {
        List<UUID> variantIds = variants.stream()
                .map(ProductVariantEntity::getId)
                .filter(Objects::nonNull)
                .toList();
        if (variantIds.isEmpty()) {
            return Map.of();
        }

        return flashSaleService.getActiveItemsByVariantIds(variantIds).stream()
                .filter(item -> item.getVariantId() != null)
                .collect(Collectors.toMap(
                        item -> UUID.fromString(item.getVariantId()),
                        this::toProductFlashSale,
                        (left, right) -> left,
                        LinkedHashMap::new));
    }

    private ProductResponse.FlashSaleSummaryResponse toProductFlashSale(com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleItemResponse item) {
        return ProductResponse.FlashSaleSummaryResponse.builder()
                .id(item.getId())
                .campaignId(item.getCampaignId())
                .campaignName(item.getCampaignName())
                .flashPrice(item.getFlashPrice())
                .originalPrice(item.getOriginalPrice())
                .remainingStock(item.getRemainingStock())
                .saleStock(item.getSaleStock())
                .perUserLimit(item.getPerUserLimit())
                .startAt(item.getStartAt())
                .endAt(item.getEndAt())
                .status(item.getStatus() != null ? item.getStatus().name() : null)
                .build();
    }

    private ProductListResponse.FlashSaleSummaryResponse toProductListFlashSale(ProductResponse.FlashSaleSummaryResponse flashSale) {
        if (flashSale == null) {
            return null;
        }
        return ProductListResponse.FlashSaleSummaryResponse.builder()
                .id(flashSale.getId())
                .campaignId(flashSale.getCampaignId())
                .campaignName(flashSale.getCampaignName())
                .flashPrice(flashSale.getFlashPrice())
                .originalPrice(flashSale.getOriginalPrice())
                .remainingStock(flashSale.getRemainingStock())
                .saleStock(flashSale.getSaleStock())
                .perUserLimit(flashSale.getPerUserLimit())
                .startAt(flashSale.getStartAt())
                .endAt(flashSale.getEndAt())
                .status(flashSale.getStatus())
                .build();
    }

    private void ensureOneDefaultActiveVariant(List<ProductVariantEntity> variants) {
        boolean hasDefaultActive = variants.stream()
                .anyMatch(v -> Boolean.TRUE.equals(v.getIsDefault()) && Boolean.TRUE.equals(v.getIsActive()));
        if (hasDefaultActive) {
            return;
        }
        variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                .findFirst()
                .ifPresent(v -> v.setIsDefault(true));
    }

    private void ensureInventorySummary(UUID variantId) {
        if (inventorySummaryRepository.findByVariantId(variantId).isEmpty()) {
            inventorySummaryRepository.insertDefaultSummary(variantId);
        }
    }

    private List<ProductImageEntity> buildProductImages(String primaryImage, List<String> secondaryImages, ProductEntity product) {
        List<ProductImageEntity> images = new ArrayList<>();

        if (org.springframework.util.StringUtils.hasText(primaryImage)) {
            images.add(ProductImageEntity.builder()
                    .url(primaryImage.trim())
                    .isPrimary(true)
                    .product(product)
                    .build());
        }

        if (secondaryImages != null) {
            images.addAll(secondaryImages.stream()
                    .filter(org.springframework.util.StringUtils::hasText)
                    .map(url -> ProductImageEntity.builder()
                            .url(url.trim())
                            .isPrimary(false)
                            .product(product)
                            .build())
                    .toList());
        }

        return images;
    }

    private String resolvePrimaryImage(ProductEntity product) {
        return resolvePrimaryImage(product.getImages());
    }

    private String resolvePrimaryImage(List<ProductImageEntity> images) {
        if (images == null || images.isEmpty()) {
            return null;
        }

        return images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(ProductImageEntity::getUrl)
                .findFirst()
                .orElse(images.get(0).getUrl());
    }

    private List<String> resolveSecondaryImages(ProductEntity product) {
        return resolveSecondaryImages(product.getImages());
    }

    private List<String> resolveSecondaryImages(List<ProductImageEntity> images) {
        if (images == null || images.isEmpty()) {
            return List.of();
        }

        return images.stream()
                .filter(img -> !Boolean.TRUE.equals(img.getIsPrimary()))
                .map(ProductImageEntity::getUrl)
                .toList();
    }

    private Map<UUID, List<ProductVariantEntity>> loadVariantsByProductIds(List<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }

        return productRepository.findVariantsByProductIds(productIds).stream()
                .collect(Collectors.groupingBy(
                        variant -> variant.getProduct().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    private Map<UUID, List<ProductImageEntity>> loadImagesByProductIds(List<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }

        return productRepository.findImagesByProductIds(productIds).stream()
                .collect(Collectors.groupingBy(
                        image -> image.getProduct().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    private Map<UUID, List<ProductIngredientEntity>> loadIngredientsByProductIds(List<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Map.of();
        }

        return productRepository.findIngredientsByProductIds(productIds).stream()
                .collect(Collectors.groupingBy(
                        ingredient -> ingredient.getProduct().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    private String normalizePlainText(String value) {
        return org.springframework.util.StringUtils.hasText(value) ? value.trim() : null;
    }
}
