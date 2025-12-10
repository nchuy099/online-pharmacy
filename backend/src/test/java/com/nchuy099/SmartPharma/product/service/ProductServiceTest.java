package com.nchuy099.SmartPharma.product.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.inventory.service.InventoryDomainService;
import com.nchuy099.SmartPharma.media.service.MediaService;
import com.nchuy099.SmartPharma.product.dto.request.CreateProductRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductCategoriesRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductRequest;
import com.nchuy099.SmartPharma.product.entity.CategoryEntity;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.product.entity.ProductImageEntity;
import com.nchuy099.SmartPharma.product.entity.ProductIngredientEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.CategoryRepository;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;
import com.nchuy099.SmartPharma.review.repository.ReviewRepository;

class ProductServiceTest {

    private ProductRepository productRepository;
    private ProductVariantRepository productVariantRepository;
    private CategoryRepository categoryRepository;
    private ReviewRepository reviewRepository;
    private ProductService productService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        productVariantRepository = mock(ProductVariantRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        reviewRepository = mock(ReviewRepository.class);

        MediaService mediaService = new MediaService(
                mock(com.nchuy099.SmartPharma.common.utils.SecurityUtils.class),
                mock(com.nchuy099.SmartPharma.user.repository.UserRepository.class),
                mock(software.amazon.awssdk.services.s3.presigner.S3Presigner.class));
        ReflectionTestUtils.setField(mediaService, "bucket", "smartpharma-bucket");
        ReflectionTestUtils.setField(mediaService, "region", "ap-southeast-1");

        productService = new ProductService(productRepository, productVariantRepository, categoryRepository, reviewRepository,
                mock(InventoryDomainService.class), mediaService);

        when(productRepository.saveAndFlush(any(ProductEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.save(any(ProductEntity.class))).thenAnswer(invocation -> {
            ProductEntity saved = invocation.getArgument(0);
            if (saved.getVariants() != null) {
                saved.getVariants().forEach(variant -> {
                    if (variant.getId() == null) {
                        variant.setId(UUID.randomUUID());
                    }
                });
            }
            return saved;
        });
    }

    @Test
    void updateShouldReuseExistingVariantsWhenRequestOmitsVariantIds() {
        UUID productId = UUID.randomUUID();
        UUID existingVariantId = UUID.randomUUID();
        UUID removedVariantId = UUID.randomUUID();
        ProductEntity product = ProductEntity.builder()
                .code("PRO866600")
                .slug("vitamin-c")
                .name("Vitamin C")
                .variants(new ArrayList<>(List.of(
                        com.nchuy099.SmartPharma.product.entity.ProductVariantEntity.builder()
                                .sku("PRO866600001")
                                .unitType("Hộp")
                                .specification("cũ")
                                .salePrice(java.math.BigDecimal.valueOf(9000))
                                .discountPercent(java.math.BigDecimal.ZERO)
                                .isDefault(true)
                                .isActive(true)
                                .product(null)
                                .build(),
                        com.nchuy099.SmartPharma.product.entity.ProductVariantEntity.builder()
                                .sku("PRO866600002")
                                .unitType("Vỉ")
                                .specification("sẽ bỏ")
                                .salePrice(java.math.BigDecimal.valueOf(8000))
                                .discountPercent(java.math.BigDecimal.ZERO)
                                .isDefault(false)
                                .isActive(true)
                                .product(null)
                                .build()
                )))
                .build();
        product.setId(productId);
        product.getVariants().get(0).setId(existingVariantId);
        product.getVariants().get(0).setProduct(product);
        product.getVariants().get(1).setId(removedVariantId);
        product.getVariants().get(1).setProduct(product);

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        UpdateProductRequest request = UpdateProductRequest.builder()
                .variants(List.of(
                        CreateProductRequest.VariantRequest.builder()
                                .id(existingVariantId.toString())
                                .unitType("Hộp")
                                .specification("10 viên mới")
                                .salePrice(java.math.BigDecimal.valueOf(10000))
                                .isDefault(true)
                                .isActive(true)
                                .build(),
                        CreateProductRequest.VariantRequest.builder()
                                .unitType("Chai")
                                .specification("dạng mới")
                                .salePrice(java.math.BigDecimal.valueOf(12000))
                                .isDefault(false)
                                .isActive(true)
                                .build()))
                .build();

        productService.update(productId, request);

        assertEquals(2, product.getVariants().size());
        assertEquals("10 viên mới", product.getVariants().stream()
                .filter(v -> existingVariantId.equals(v.getId()))
                .findFirst()
                .orElseThrow()
                .getSpecification());
        assertEquals("dạng mới", product.getVariants().stream()
                .filter(v -> "dạng mới".equals(v.getSpecification()))
                .findFirst()
                .orElseThrow()
                .getSpecification());
        assertEquals(true, product.getVariants().stream()
                .filter(v -> removedVariantId.equals(v.getId()))
                .findFirst()
                .orElseThrow()
                .getIsActive());
        assertEquals(false, product.getVariants().stream()
                .filter(v -> removedVariantId.equals(v.getId()))
                .findFirst()
                .orElseThrow()
                .getIsDefault());
    }

    @Test
    void updateCategoriesShouldUpdateCategoriesWhenValid() {
        UUID productId = UUID.randomUUID();
        String categoryId = UUID.randomUUID().toString();

        ProductEntity product = ProductEntity.builder()
                .code("PRD-1")
                .slug("vitamin-c")
                .name("Vitamin C")
                .categories(new java.util.HashSet<>())
                .build();
        product.setId(productId);

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(categoryRepository.findAllById(any())).thenReturn(List.of(category(categoryId)));

        UpdateProductCategoriesRequest request = UpdateProductCategoriesRequest.builder()
                .categoryIds(List.of(categoryId))
                .build();

        productService.updateCategories(productId, request);

        assertEquals(1, product.getCategories().size());
        assertEquals(categoryId, product.getCategories().iterator().next().getId().toString());
    }

    @Test
    void updateCategoriesShouldRejectWhenCategoryIdsEmpty() {
        UUID productId = UUID.randomUUID();
        ProductEntity product = ProductEntity.builder()
                .code("PRD-1")
                .slug("vitamin-c")
                .name("Vitamin C")
                .categories(new java.util.HashSet<>())
                .build();
        product.setId(productId);

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        UpdateProductCategoriesRequest request = UpdateProductCategoriesRequest.builder()
                .categoryIds(List.of())
                .build();

        AppException exception = assertThrows(AppException.class, () -> productService.updateCategories(productId, request));

        assertEquals("Category ids must not be empty", exception.getMessage());
    }

    @Test
    void updateCategoriesShouldRejectWhenSomeCategoriesNotFound() {
        UUID productId = UUID.randomUUID();
        String requestedCategoryId = UUID.randomUUID().toString();
        ProductEntity product = ProductEntity.builder()
                .code("PRD-1")
                .slug("vitamin-c")
                .name("Vitamin C")
                .categories(new java.util.HashSet<>())
                .build();
        product.setId(productId);

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(categoryRepository.findAllById(any())).thenReturn(List.of());

        UpdateProductCategoriesRequest request = UpdateProductCategoriesRequest.builder()
                .categoryIds(List.of(requestedCategoryId))
                .build();

        AppException exception = assertThrows(AppException.class, () -> productService.updateCategories(productId, request));

        assertEquals("Categories not found: [" + requestedCategoryId + "]", exception.getMessage());
    }

    @Test
    void getListShouldUseDefaultQueryAndHydrateInIdOrder() {
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();

        ProductEntity firstProduct = product(firstId, "first-product", "First Product", 1, 8, 10_000);
        ProductEntity secondProduct = product(secondId, "second-product", "Second Product", 2, 4, 12_000);
        ProductRepository.ProductReviewStatsProjection secondStats = reviewStats(secondId, 4.26, 7L);

        when(productRepository.findListProductIdsDefault(anyCollection(), anyBoolean(), isNull(), isNull(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(secondId, firstId), PageRequest.of(0, 10), 2));
        when(productRepository.findByIdInWithBaseDetails(List.of(secondId, firstId)))
                .thenReturn(List.of(firstProduct, secondProduct));
        when(productRepository.findVariantsByProductIds(List.of(secondId, firstId)))
                .thenReturn(List.of(
                        secondProduct.getVariants().get(0),
                        firstProduct.getVariants().get(0)));
        when(productRepository.findImagesByProductIds(List.of(secondId, firstId)))
                .thenReturn(List.of(
                        primaryImage(secondProduct, "https://img/second-primary.webp"),
                        primaryImage(firstProduct, "https://img/first-primary.webp")));
        when(productRepository.findReviewStatsByProductIds(List.of(secondId, firstId)))
                .thenReturn(List.of(secondStats));

        var response = productService.getListByProductIds(1, 10, null, null, null, null, null, true);

        assertEquals(2, response.getProducts().size());
        assertEquals(secondId.toString(), response.getProducts().get(0).getId());
        assertEquals(firstId.toString(), response.getProducts().get(1).getId());
        assertEquals(4.3, response.getProducts().get(0).getAverageRating(), 0.0001);
        assertEquals(7L, response.getProducts().get(0).getTotalReviews());
        assertEquals(0.0, response.getProducts().get(1).getAverageRating());
        assertEquals(0L, response.getProducts().get(1).getTotalReviews());
        assertEquals("https://img/second-primary.webp", response.getProducts().get(0).getPrimaryImage());
        assertEquals("https://img/first-primary.webp", response.getProducts().get(1).getPrimaryImage());

        verify(productRepository).findListProductIdsDefault(anyCollection(), eq(false), isNull(), isNull(), isNull(), any());
    }

    @Test
    void getListShouldUsePriceLowQueryForSorting() {
        UUID productId = UUID.randomUUID();
        ProductEntity product = product(productId, "price-low-product", "Price Low Product", 1, 3, 9_000);

        when(productRepository.findListProductIdsPriceLow(anyCollection(), anyBoolean(), eq("pain relief"), isNull(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(productId), PageRequest.of(0, 10), 1));
        when(productRepository.findByIdInWithBaseDetails(List.of(productId))).thenReturn(List.of(product));
        when(productRepository.findVariantsByProductIds(List.of(productId))).thenReturn(List.of(product.getVariants().get(0)));
        when(productRepository.findImagesByProductIds(List.of(productId))).thenReturn(List.of());
        when(productRepository.findReviewStatsByProductIds(List.of(productId))).thenReturn(List.of());

        var response = productService.getListByProductIds(1, 10, null, "pain relief", "price-low", null, null, true);

        assertEquals(1, response.getProducts().size());
        verify(productRepository).findListProductIdsPriceLow(anyCollection(), eq(false), eq("pain relief"), isNull(), isNull(), any());
    }

    @Test
    void getListShouldUsePriceHighQueryForSorting() {
        UUID productId = UUID.randomUUID();
        ProductEntity product = product(productId, "price-high-product", "Price High Product", 1, 3, 19_000);

        when(productRepository.findListProductIdsPriceHigh(anyCollection(), anyBoolean(), isNull(), isNull(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(productId), PageRequest.of(0, 10), 1));
        when(productRepository.findByIdInWithBaseDetails(List.of(productId))).thenReturn(List.of(product));
        when(productRepository.findVariantsByProductIds(List.of(productId))).thenReturn(List.of(product.getVariants().get(0)));
        when(productRepository.findImagesByProductIds(List.of(productId))).thenReturn(List.of());
        when(productRepository.findReviewStatsByProductIds(List.of(productId))).thenReturn(List.of());

        var response = productService.getListByProductIds(1, 10, null, null, "price-high", null, null, true);

        assertEquals(1, response.getProducts().size());
        verify(productRepository).findListProductIdsPriceHigh(anyCollection(), eq(false), isNull(), isNull(), isNull(), any());
    }

    @Test
    void getDetailsShouldLoadVariantsImagesIngredientsSeparately() {
        UUID productId = UUID.randomUUID();
        ProductEntity product = product(productId, "detail-product", "Detail Product", 6, 1, 25_000);
        ProductImageEntity primaryImage = primaryImage(product, "https://img/detail-primary.webp");
        ProductImageEntity secondaryImage = secondaryImage(product, "https://img/detail-secondary.webp");
        ProductIngredientEntity ingredient = ingredient(product, 10L, "Vitamin C");

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.findVariantsByProductIds(List.of(productId))).thenReturn(List.of(product.getVariants().get(0)));
        when(productRepository.findImagesByProductIds(List.of(productId))).thenReturn(List.of(primaryImage, secondaryImage));
        when(productRepository.findIngredientsByProductIds(List.of(productId))).thenReturn(List.of(ingredient));
        when(reviewRepository.findAverageRatingByProductId(productId)).thenReturn(4.66);
        when(reviewRepository.countByProductId(productId)).thenReturn(9L);

        var response = productService.getDetails(productId);

        assertEquals(productId.toString(), response.getId());
        assertEquals("https://img/detail-primary.webp", response.getPrimaryImage());
        assertEquals(List.of("https://img/detail-secondary.webp"), response.getSecondaryImages());
        assertEquals(1, response.getVariants().size());
        assertEquals(1, response.getIngredient().size());
        assertEquals("Vitamin C", response.getIngredient().get(0).getName());
        assertEquals(4.7, response.getAverageRating(), 0.0001);
        assertEquals(9L, response.getTotalReviews());
    }

    @Test
    void getDetailsBySlugShouldThrowWhenProductMissing() {
        when(productRepository.findBySlug("missing-product")).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class,
                () -> productService.getDetailsBySlug("missing-product"));

        assertEquals("Product not found with slug: missing-product", exception.getMessage());
    }

    private ProductEntity product(UUID id, String slug, String name, int quantityOnHand, int quantityReserved, int salePrice) {
        ProductEntity product = ProductEntity.builder()
                .code("PRO123456")
                .slug(slug)
                .name(name)
                .categories(new java.util.HashSet<>(List.of(category(UUID.randomUUID().toString()))))
                .variants(new ArrayList<>())
                .build();
        product.setId(id);

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .sku("PRO123456001")
                .unitType("Hộp")
                .specification("spec")
                .salePrice(java.math.BigDecimal.valueOf(salePrice))
                .discountPercent(java.math.BigDecimal.ZERO)
                .isDefault(true)
                .isActive(true)
                .product(product)
                .inventory(InventoryEntity.builder()
                        .quantityOnHand(quantityOnHand)
                        .quantityReserved(quantityReserved)
                        .build())
                .build();
        variant.getInventory().setVariant(variant);
        product.getVariants().add(variant);
        return product;
    }

    private ProductImageEntity primaryImage(ProductEntity product, String url) {
        return ProductImageEntity.builder()
                .product(product)
                .url(url)
                .isPrimary(true)
                .build();
    }

    private ProductImageEntity secondaryImage(ProductEntity product, String url) {
        return ProductImageEntity.builder()
                .product(product)
                .url(url)
                .isPrimary(false)
                .build();
    }

    private ProductIngredientEntity ingredient(ProductEntity product, Long ingredientId, String name) {
        return ProductIngredientEntity.builder()
                .product(product)
                .ingredientId(ingredientId)
                .name(name)
                .shortDescription(name + " description")
                .build();
    }

    private ProductRepository.ProductReviewStatsProjection reviewStats(UUID productId, double averageRating, long totalReviews) {
        ProductRepository.ProductReviewStatsProjection stats = mock(ProductRepository.ProductReviewStatsProjection.class);
        when(stats.getProductId()).thenReturn(productId);
        when(stats.getAverageRating()).thenReturn(averageRating);
        when(stats.getTotalReviews()).thenReturn(totalReviews);
        return stats;
    }

    private CategoryEntity category(String id) {
        CategoryEntity category = CategoryEntity.builder().name("Supplements").slug("supplements").build();
        category.setId(UUID.fromString(id));
        return category;
    }
}
