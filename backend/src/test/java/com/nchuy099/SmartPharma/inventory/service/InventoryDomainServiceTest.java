package com.nchuy099.SmartPharma.inventory.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventoryRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;

class InventoryDomainServiceTest {

    private InventoryRepository inventoryRepository;
    private InventoryTransactionRepository inventoryTransactionRepository;
    private ProductVariantRepository productVariantRepository;
    private InventoryDomainService inventoryDomainService;

    @BeforeEach
    void setUp() {
        inventoryRepository = mock(InventoryRepository.class);
        inventoryTransactionRepository = mock(InventoryTransactionRepository.class);
        productVariantRepository = mock(ProductVariantRepository.class);
        inventoryDomainService = new InventoryDomainService(
                inventoryRepository,
                inventoryTransactionRepository,
                productVariantRepository);
    }

    @Test
    void getInventoryShouldCreateDefaultSummaryWhenMissing() {
        UUID variantId = UUID.randomUUID();
        ProductVariantEntity variant = variant(variantId);
        InventorySummaryEntity summary = summary(variant, 0, 0);

        when(inventoryRepository.findByVariantId(variantId))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(summary));
        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(inventoryRepository.insertDefaultSummary(variantId)).thenReturn(1);

        InventoryEntity result = inventoryDomainService.getInventory(variantId.toString());

        assertEquals(variantId, result.getVariant().getId());
        assertEquals(0, result.getQuantityAvailable());
        verify(inventoryRepository).insertDefaultSummary(variantId);
    }

    @Test
    void reserveShouldIncreaseReservedQuantity() {
        InventoryEntity inventory = inventory(10, 2);

        inventoryDomainService.reserve(inventory, 4);

        assertEquals(6, inventory.getQuantityReserved());
        assertEquals(4, inventory.getQuantityAvailable());
    }

    @Test
    void exportShouldFailWhenReservedNotEnough() {
        InventoryEntity inventory = inventory(10, 1);

        AppException exception = assertThrows(AppException.class, () -> inventoryDomainService.export(inventory, 2));

        assertEquals("Not enough reserved stock to export", exception.getMessage());
    }

    @Test
    void ensureCartAvailableShouldFailWhenAnyItemExceedsStock() {
        UUID variantId = UUID.randomUUID();
        ProductVariantEntity variant = variant(variantId);
        CartItemEntity item = CartItemEntity.builder()
                .variant(variant)
                .quantity(5)
                .build();

        when(inventoryRepository.findByVariantId(variantId)).thenReturn(Optional.of(summary(variant, 3, 0)));

        AppException exception = assertThrows(AppException.class,
                () -> inventoryDomainService.ensureCartAvailable(java.util.List.of(item)));

        assertEquals("Product stock not enough to proceed", exception.getMessage());
    }

    private ProductVariantEntity variant(UUID variantId) {
        ProductEntity product = ProductEntity.builder().name("Product").build();
        product.setId(UUID.randomUUID());

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .sku("SKU-" + variantId.toString().substring(0, 8))
                .product(product)
                .build();
        variant.setId(variantId);
        return variant;
    }

    private InventorySummaryEntity summary(ProductVariantEntity variant, int onHand, int reserved) {
        InventorySummaryEntity summary = InventorySummaryEntity.builder()
                .variant(variant)
                .quantityOnHand(onHand)
                .quantityReserved(reserved)
                .build();
        summary.setId(UUID.randomUUID());
        return summary;
    }

    private InventoryEntity inventory(int onHand, int reserved) {
        InventoryEntity inventory = new InventoryEntity();
        inventory.setVariant(variant(UUID.randomUUID()));
        inventory.setQuantityOnHand(onHand);
        inventory.setQuantityReserved(reserved);
        inventory.setId(UUID.randomUUID());
        return inventory;
    }
}
