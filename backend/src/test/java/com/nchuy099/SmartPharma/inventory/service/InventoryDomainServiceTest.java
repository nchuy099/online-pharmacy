package com.nchuy099.SmartPharma.inventory.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryTransactionEntity;
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
    void getInventoryShouldCreateDefaultInventoryWhenMissing() {
        UUID variantId = UUID.randomUUID();
        ProductVariantEntity variant = ProductVariantEntity.builder()
                .sku("SKU-1")
                .product(ProductEntity.builder().name("Product").build())
                .build();
        variant.setId(variantId);
        InventoryEntity createdInventory = InventoryEntity.builder()
                .variant(variant)
                .quantityOnHand(0)
                .quantityReserved(0)
                .build();

        when(inventoryRepository.findByVariant_Id(variantId))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(createdInventory));
        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(inventoryRepository.insertDefaultInventory(variantId)).thenReturn(1);

        InventoryEntity result = inventoryDomainService.getInventory(variantId.toString());

        assertSame(createdInventory, result);
        verify(inventoryRepository).insertDefaultInventory(variantId);
    }

    @Test
    void reserveShouldUseAtomicUpdateAndSaveTransaction() {
        UUID inventoryId = UUID.randomUUID();
        InventoryEntity inventory = inventoryWithId(inventoryId);
        when(inventoryRepository.reserveQuantity(inventoryId, 4)).thenReturn(1);
        when(inventoryRepository.getReferenceById(inventoryId)).thenReturn(inventory);
        when(inventoryTransactionRepository.save(any(InventoryTransactionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        inventoryDomainService.reserve(inventory, 4);

        verify(inventoryRepository).reserveQuantity(inventoryId, 4);
        ArgumentCaptor<InventoryTransactionEntity> captor = ArgumentCaptor.forClass(InventoryTransactionEntity.class);
        verify(inventoryTransactionRepository).save(captor.capture());
        assertEquals(TransactionType.RESERVE, captor.getValue().getType());
        assertEquals(4, captor.getValue().getQuantity());
        assertEquals("Reserve Stock", captor.getValue().getNote());
        assertNull(captor.getValue().getUnitCost());
    }

    @Test
    void importStockShouldUseAtomicUpdateAndRecordTransaction() {
        UUID inventoryId = UUID.randomUUID();
        InventoryEntity inventory = inventoryWithId(inventoryId);
        when(inventoryRepository.incrementQuantityOnHand(inventoryId, 7)).thenReturn(1);
        when(inventoryRepository.getReferenceById(inventoryId)).thenReturn(inventory);
        when(inventoryTransactionRepository.save(any(InventoryTransactionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        inventoryDomainService.importStock(inventory, 7, null, "Import batch");

        verify(inventoryRepository).incrementQuantityOnHand(inventoryId, 7);
        ArgumentCaptor<InventoryTransactionEntity> captor = ArgumentCaptor.forClass(InventoryTransactionEntity.class);
        verify(inventoryTransactionRepository).save(captor.capture());
        assertEquals(TransactionType.IMPORT, captor.getValue().getType());
        assertEquals(7, captor.getValue().getQuantity());
        assertEquals("Import batch", captor.getValue().getNote());
        assertEquals(BigDecimal.ZERO, captor.getValue().getUnitCost());
    }

    @Test
    void importStockShouldUpdateAverageCostUsingWeightedAverage() {
        UUID inventoryId = UUID.randomUUID();
        InventoryEntity inventory = inventoryWithId(inventoryId);
        inventory.setQuantityOnHand(10);
        inventory.getVariant().setAverageCost(BigDecimal.valueOf(100));
        inventory.getVariant().setLatestImportCost(BigDecimal.valueOf(100));

        when(inventoryRepository.incrementQuantityOnHand(inventoryId, 10)).thenReturn(1);
        when(inventoryRepository.getReferenceById(inventoryId)).thenReturn(inventory);
        when(inventoryTransactionRepository.save(any(InventoryTransactionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        inventoryDomainService.importStock(inventory, 10, BigDecimal.valueOf(150), "Weighted batch");

        assertEquals(new BigDecimal("125.00"), inventory.getVariant().getAverageCost());
        assertEquals(BigDecimal.valueOf(150), inventory.getVariant().getLatestImportCost());
        verify(productVariantRepository).save(inventory.getVariant());
    }

    @Test
    void exportShouldFailWhenAtomicUpdateTouchesNoRows() {
        UUID inventoryId = UUID.randomUUID();
        InventoryEntity inventory = inventoryWithId(inventoryId);
        when(inventoryRepository.exportQuantity(inventoryId, 2)).thenReturn(0);

        AppException exception = assertThrows(AppException.class, () -> inventoryDomainService.export(inventory, 2));

        assertEquals("Not enough reserved stock to export", exception.getMessage());
        verify(inventoryTransactionRepository, never()).save(any(InventoryTransactionEntity.class));
    }

    @Test
    void releaseShouldUseAtomicUpdateAndRecordTransaction() {
        UUID inventoryId = UUID.randomUUID();
        InventoryEntity inventory = inventoryWithId(inventoryId);
        when(inventoryRepository.releaseReservation(inventoryId, 3)).thenReturn(1);
        when(inventoryRepository.getReferenceById(inventoryId)).thenReturn(inventory);
        when(inventoryTransactionRepository.save(any(InventoryTransactionEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        inventoryDomainService.release(inventory, 3);

        verify(inventoryRepository).releaseReservation(inventoryId, 3);
        ArgumentCaptor<InventoryTransactionEntity> captor = ArgumentCaptor.forClass(InventoryTransactionEntity.class);
        verify(inventoryTransactionRepository).save(captor.capture());
        assertEquals(TransactionType.RELEASE, captor.getValue().getType());
        assertEquals(3, captor.getValue().getQuantity());
        assertEquals("Release reserved stock", captor.getValue().getNote());
    }

    private InventoryEntity inventoryWithId(UUID inventoryId) {
        ProductVariantEntity variant = ProductVariantEntity.builder()
                .sku("SKU-" + inventoryId.toString().substring(0, 8))
                .product(ProductEntity.builder().name("Product").build())
                .build();
        variant.setId(UUID.randomUUID());

        InventoryEntity inventory = InventoryEntity.builder()
                .variant(variant)
                .quantityOnHand(10)
                .quantityReserved(2)
                .build();
        inventory.setId(inventoryId);
        return inventory;
    }
}
