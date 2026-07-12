package com.nchuy099.SmartPharma.flashsale.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleItemStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSlot;
import com.nchuy099.SmartPharma.flashsale.dto.request.CreateFlashSaleCampaignRequest;
import com.nchuy099.SmartPharma.flashsale.dto.request.GenerateRandomFlashSaleCampaignRequest;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleItemResponse;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleCampaignResponse;
import com.nchuy099.SmartPharma.flashsale.entity.FlashSaleCampaignEntity;
import com.nchuy099.SmartPharma.flashsale.repository.FlashSaleCampaignRepository;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductImageEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;

class FlashSaleAutoGenerationServiceTest {

    private FlashSaleCampaignRepository campaignRepository;
    private FlashSaleService flashSaleService;
    private ProductVariantRepository productVariantRepository;
    private InventorySummaryRepository inventoryRepository;
    private FlashSaleAutoGenerationService service;

    @BeforeEach
    void setUp() {
        campaignRepository = mock(FlashSaleCampaignRepository.class);
        flashSaleService = mock(FlashSaleService.class);
        productVariantRepository = mock(ProductVariantRepository.class);
        inventoryRepository = mock(InventorySummaryRepository.class);
        service = new FlashSaleAutoGenerationService(
                campaignRepository,
                flashSaleService,
                productVariantRepository,
                inventoryRepository);
        ReflectionTestUtils.setField(service, "dailyItemCount", 10);
        ReflectionTestUtils.setField(service, "discountPercent", new BigDecimal("20"));
        ReflectionTestUtils.setField(service, "saleStockPerItem", 10);
        ReflectionTestUtils.setField(service, "perUserLimit", 1);
    }

    @Test
    void generateForDateShouldCreateCampaignWithEligibleVariants() {
        LocalDate date = LocalDate.of(2026, 6, 17);
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        String campaignCode = "AUTO-FS-20260617";

        when(campaignRepository.findByCode(campaignCode)).thenReturn(Optional.empty());

        List<UUID> variantIds = new ArrayList<>();
        Map<UUID, InventorySummaryEntity> inventories = new HashMap<>();
        Map<UUID, ProductVariantEntity> variants = new HashMap<>();
        for (int i = 0; i < 10; i++) {
            UUID variantId = UUID.randomUUID();
            variantIds.add(variantId);
            variants.put(variantId, variantWithImage(variantId, "Variant " + i, BigDecimal.valueOf(100_000 + i * 10_000)));
            inventories.put(variantId, inventoryWithVariant(variantId, 12 + i));
        }

        when(productVariantRepository.findEligibleAutoFlashSaleVariantIds(anyCollection(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(variantIds));
        when(inventoryRepository.findAllByVariantIds(variantIds)).thenReturn(new ArrayList<>(inventories.values()));
        for (UUID variantId : variantIds) {
            when(productVariantRepository.findByIdWithProduct(variantId)).thenReturn(Optional.of(variants.get(variantId)));
        }

        FlashSaleCampaignResponse createdResponse = FlashSaleCampaignResponse.builder()
                .id(UUID.randomUUID().toString())
                .code(campaignCode)
                .items(List.of())
                .build();
        when(flashSaleService.createAndPublishCampaign(eq(campaignCode), any(CreateFlashSaleCampaignRequest.class)))
                .thenAnswer(invocation -> {
                    CreateFlashSaleCampaignRequest request = invocation.getArgument(1);
                    assertEquals("Flash Sale 2026-06-17", request.getName());
                    assertEquals(10, request.getItems().size());
                    assertEquals(date, request.getCampaignDate());
                    assertEquals(FlashSaleSlot.MORNING_09_11, request.getSlotCode());
                    assertEquals(FlashSaleCampaignType.NORMAL, request.getType());
                    assertTrue(request.getItems().stream().allMatch(item -> item.getPerUserLimit() == 1));
                    assertTrue(request.getItems().stream().allMatch(item -> item.getSaleStock() <= 10));
                    assertTrue(request.getItems().stream().allMatch(item -> item.getFlashPrice().compareTo(BigDecimal.ZERO) > 0));
                    List<FlashSaleItemResponse> itemResponses = request.getItems().stream()
                            .map(item -> FlashSaleItemResponse.builder()
                                    .id(UUID.randomUUID().toString())
                                    .campaignId(createdResponse.getId())
                                    .campaignCode(campaignCode)
                                    .campaignName("Flash Sale 2026-06-17")
                                    .variantId(item.getVariantId().toString())
                                    .variantSku("SKU-" + item.getVariantId())
                                    .variantUnitType("Hộp")
                                    .productId(UUID.randomUUID().toString())
                                    .productName("Product")
                                    .productSlug("product")
                                    .productImage("https://img.example.com/p.png")
                                    .flashPrice(item.getFlashPrice())
                                    .originalPrice(BigDecimal.valueOf(100000))
                                    .saleStock(item.getSaleStock())
                                    .remainingStock(item.getSaleStock())
                                    .perUserLimit(item.getPerUserLimit())
                                    .variantSpecification("10 vien")
                                    .status(FlashSaleItemStatus.ACTIVE)
                                    .build())
                            .toList();
                    return FlashSaleCampaignResponse.builder()
                            .id(createdResponse.getId())
                            .code(campaignCode)
                            .items(itemResponses)
                            .build();
                });

        Optional<FlashSaleCampaignResponse> result = service.generateForDate(date, zone);

        assertTrue(result.isPresent());
        assertEquals(campaignCode, result.get().getCode());
        assertEquals(10, result.get().getItems().size());
        verify(campaignRepository).findByCode(campaignCode);
        verify(flashSaleService).createAndPublishCampaign(eq(campaignCode), any(CreateFlashSaleCampaignRequest.class));
    }

    @Test
    void generateForDateShouldReturnExistingCampaignWhenCodeAlreadyExists() {
        LocalDate date = LocalDate.of(2026, 6, 17);
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        String campaignCode = "AUTO-FS-20260617";

        FlashSaleCampaignEntity existing = FlashSaleCampaignEntity.builder()
                .code(campaignCode)
                .name("Existing")
                .build();
        existing.setId(UUID.randomUUID());

        when(campaignRepository.findByCode(campaignCode)).thenReturn(Optional.of(existing));
        FlashSaleCampaignResponse existingResponse = FlashSaleCampaignResponse.builder()
                .id(existing.getId().toString())
                .code(campaignCode)
                .items(List.of())
                .build();
        when(flashSaleService.getCampaign(existing.getId())).thenReturn(existingResponse);

        Optional<FlashSaleCampaignResponse> result = service.generateForDate(date, zone);

        assertTrue(result.isPresent());
        assertEquals(existing.getId().toString(), result.get().getId());
        verify(flashSaleService).getCampaign(existing.getId());
        verify(productVariantRepository, never()).findEligibleAutoFlashSaleVariantIds(anyCollection(), any(Pageable.class));
    }

    @Test
    void generateForDateShouldReturnEmptyWhenNoCandidates() {
        LocalDate date = LocalDate.of(2026, 6, 17);
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        String campaignCode = "AUTO-FS-20260617";

        when(campaignRepository.findByCode(campaignCode)).thenReturn(Optional.empty());
        when(productVariantRepository.findEligibleAutoFlashSaleVariantIds(anyCollection(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        Optional<FlashSaleCampaignResponse> result = service.generateForDate(date, zone);

        assertFalse(result.isPresent());
        verify(flashSaleService, never()).createAndPublishCampaign(anyString(), any());
    }

    @Test
    void generateRandomDraftCampaignShouldCreateDraftCampaignWithEligibleVariants() {
        List<UUID> variantIds = new ArrayList<>();
        Map<UUID, InventorySummaryEntity> inventories = new HashMap<>();
        Map<UUID, ProductVariantEntity> variants = new HashMap<>();
        for (int i = 0; i < 10; i++) {
            UUID variantId = UUID.randomUUID();
            variantIds.add(variantId);
            variants.put(variantId, variantWithImage(variantId, "Random Product " + i, BigDecimal.valueOf(150_000 + i * 5_000)));
            inventories.put(variantId, inventoryWithVariant(variantId, 20));
        }

        when(productVariantRepository.findRandomEligibleAutoFlashSaleVariantIds(anyCollection(), eq(10)))
                .thenReturn(variantIds);
        when(inventoryRepository.findAllByVariantIds(variantIds)).thenReturn(new ArrayList<>(inventories.values()));
        for (UUID variantId : variantIds) {
            when(productVariantRepository.findByIdWithProduct(variantId)).thenReturn(Optional.of(variants.get(variantId)));
        }

        when(flashSaleService.createCampaign(any(CreateFlashSaleCampaignRequest.class)))
                .thenAnswer(invocation -> {
                    CreateFlashSaleCampaignRequest request = invocation.getArgument(0);
                    assertEquals(10, request.getItems().size());
                    assertEquals("Random Draft", request.getName());
                    assertNotNull(request.getCampaignDate());
                    assertNotNull(request.getSlotCode());
                    return FlashSaleCampaignResponse.builder()
                            .id(UUID.randomUUID().toString())
                            .code("FSC-1")
                            .items(List.of())
                            .build();
                });

        GenerateRandomFlashSaleCampaignRequest request = new GenerateRandomFlashSaleCampaignRequest();
        request.setName("Random Draft");
        request.setItemCount(10);
        request.setSaleStockPerItem(10);
        request.setPerUserLimit(1);
        request.setDiscountPercent(new BigDecimal("20"));

        FlashSaleCampaignResponse result = service.generateRandomDraftCampaign(request);

        assertEquals("FSC-1", result.getCode());
        verify(flashSaleService).createCampaign(any(CreateFlashSaleCampaignRequest.class));
    }

    private ProductVariantEntity variantWithImage(UUID variantId, String productName, BigDecimal salePrice) {
        ProductEntity product = ProductEntity.builder()
                .name(productName)
                .slug(productName.toLowerCase().replace(' ', '-'))
                .webName(productName)
                .isActive(true)
                .images(new ArrayList<>(List.of(
                        ProductImageEntity.builder()
                                .url("https://img.example.com/" + variantId + ".png")
                                .isPrimary(true)
                                .build())))
                .build();
        product.setId(UUID.randomUUID());

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .sku("SKU-" + variantId)
                .unitType("Hộp")
                .specification("10 viên")
                .salePrice(salePrice)
                .isActive(true)
                .product(product)
                .build();
        variant.setId(variantId);
        return variant;
    }

    private InventorySummaryEntity inventoryWithVariant(UUID variantId, int available) {
        ProductVariantEntity variant = ProductVariantEntity.builder()
                .sku("SKU-" + variantId)
                .build();
        variant.setId(variantId);
        return InventorySummaryEntity.builder()
                .variant(variant)
                .quantityOnHand(available)
                .quantityReserved(0)
                .build();
    }
}
