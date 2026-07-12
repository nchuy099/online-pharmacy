package com.nchuy099.SmartPharma.product.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import com.nchuy099.SmartPharma.media.service.MediaService;
import com.nchuy099.SmartPharma.product.dto.request.CreateProductRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductCategoriesRequest;
import com.nchuy099.SmartPharma.product.dto.request.UpdateProductRequest;
import com.nchuy099.SmartPharma.product.entity.CategoryEntity;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.repository.CategoryRepository;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;
import com.nchuy099.SmartPharma.review.repository.ReviewRepository;

class ProductServiceTest {

    private ProductRepository productRepository;
    private ProductVariantRepository productVariantRepository;
    private CategoryRepository categoryRepository;
    private ReviewRepository reviewRepository;
    private InventorySummaryRepository inventorySummaryRepository;
    private FlashSaleService flashSaleService;
    private ProductService productService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        productVariantRepository = mock(ProductVariantRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        reviewRepository = mock(ReviewRepository.class);
        inventorySummaryRepository = mock(InventorySummaryRepository.class);
        flashSaleService = mock(FlashSaleService.class);

        MediaService mediaService = new MediaService(
                mock(com.nchuy099.SmartPharma.common.utils.SecurityUtils.class),
                mock(com.nchuy099.SmartPharma.user.repository.UserRepository.class),
                mock(software.amazon.awssdk.services.s3.presigner.S3Presigner.class));
        ReflectionTestUtils.setField(mediaService, "bucket", "smartpharma-bucket");
        ReflectionTestUtils.setField(mediaService, "region", "ap-southeast-1");

        productService = new ProductService(
                productRepository,
                productVariantRepository,
                categoryRepository,
                reviewRepository,
                inventorySummaryRepository,
                flashSaleService,
                mediaService);

        when(productRepository.saveAndFlush(any(ProductEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.save(any(ProductEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
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
                                .build())))
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
        assertEquals(true, product.getVariants().stream()
                .filter(v -> removedVariantId.equals(v.getId()))
                .findFirst()
                .orElseThrow()
                .getIsActive());
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

    private CategoryEntity category(String id) {
        CategoryEntity category = CategoryEntity.builder().name("Vitamin").build();
        category.setId(UUID.fromString(id));
        return category;
    }
}
