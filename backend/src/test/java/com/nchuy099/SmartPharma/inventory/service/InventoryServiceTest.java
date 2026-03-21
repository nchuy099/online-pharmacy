package com.nchuy099.SmartPharma.inventory.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.nchuy099.SmartPharma.inventory.dto.response.InventoryPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionPageResponse;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryTransactionEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventoryRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository.AverageImportCostProjection;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

class InventoryServiceTest {

    private InventoryRepository inventoryRepository;
    private InventoryTransactionRepository inventoryTransactionRepository;
    private InventoryDomainService inventoryDomainService;
    private InventoryService inventoryService;

    @BeforeEach
    void setUp() {
        inventoryRepository = mock(InventoryRepository.class);
        inventoryTransactionRepository = mock(InventoryTransactionRepository.class);
        inventoryDomainService = mock(InventoryDomainService.class);
        inventoryService = new InventoryService(inventoryRepository, inventoryTransactionRepository, inventoryDomainService);
    }

    @Test
    void getInventoryListShouldExposeAverageImportCost() {
        UUID productId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID variantId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        InventoryEntity inventory = inventory(productId, variantId, "Product A", "SKU-A", 20, 5, BigDecimal.valueOf(100000));

        when(inventoryRepository.findAllWithVariant(anyString(), any()))
                .thenReturn(new PageImpl<>(List.of(inventory), PageRequest.of(0, 10), 1));
        when(inventoryTransactionRepository.findAverageImportCostsByVariantIds(anyCollection()))
                .thenReturn(List.of(averageProjection(variantId, BigDecimal.valueOf(125000))));

        InventoryPageResponse response = inventoryService.getInventoryList(1, 10, "milk");

        assertNotNull(response);
        assertEquals(1, response.getInventories().size());
        assertEquals(BigDecimal.valueOf(125000), response.getInventories().get(0).getAverageImportCost());
        assertEquals(BigDecimal.valueOf(100000), response.getInventories().get(0).getSalePrice());
    }

    @Test
    void getTransactionListShouldExposeVariantSummaryAndRowPrices() {
        UUID productId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID variantId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID inventoryId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        InventoryEntity inventory = inventory(productId, variantId, "Product A", "SKU-A", 20, 5, BigDecimal.valueOf(100000));
        inventory.setId(inventoryId);
        InventoryTransactionEntity transaction = transaction(inventory, 3, BigDecimal.valueOf(90000));

        when(inventoryRepository.findByVariant_Id(variantId)).thenReturn(java.util.Optional.of(inventory));
        when(inventoryTransactionRepository.findByInventoryId(eq(inventoryId), any()))
                .thenReturn(new PageImpl<>(List.of(transaction), PageRequest.of(0, 10), 1));
        when(inventoryTransactionRepository.findAverageImportCostByVariantId(variantId))
                .thenReturn(BigDecimal.valueOf(125000));

        TransactionPageResponse response = inventoryService.getTransactionList(variantId.toString(), 1, 10);

        assertNotNull(response);
        assertEquals(variantId, response.getVariantId());
        assertEquals("SKU-A", response.getVariantSku());
        assertEquals("Hộp", response.getUnitType());
        assertEquals("10 viên", response.getSpecification());
        assertEquals(BigDecimal.valueOf(100000), response.getSalePrice());
        assertEquals(BigDecimal.valueOf(125000), response.getAverageImportCost());
        assertEquals(1, response.getInventories().size());
        assertEquals(variantId, response.getInventories().get(0).getVariantId());
        assertEquals(1, response.getTransactions().size());
        assertEquals(BigDecimal.valueOf(125000), response.getTransactions().get(0).getAverageImportCost());
        assertEquals(BigDecimal.valueOf(100000), response.getTransactions().get(0).getSalePrice());
    }

    private InventoryEntity inventory(UUID productId, UUID variantId, String productName, String sku, int onHand, int reserved, BigDecimal salePrice) {
        ProductEntity product = ProductEntity.builder()
                .name(productName)
                .webName(productName + " Web")
                .code("CODE-" + productName.replace(" ", ""))
                .slug(productName.toLowerCase().replace(" ", "-"))
                .build();
        product.setId(productId);

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .product(product)
                .sku(sku)
                .unitType("Hộp")
                .specification("10 viên")
                .salePrice(salePrice)
                .isDefault(true)
                .build();
        variant.setId(variantId);

        InventoryEntity inventory = InventoryEntity.builder()
                .variant(variant)
                .quantityOnHand(onHand)
                .quantityReserved(reserved)
                .build();
        inventory.setId(UUID.randomUUID());
        return inventory;
    }

    private InventoryTransactionEntity transaction(InventoryEntity inventory, int quantity, BigDecimal unitCost) {
        InventoryTransactionEntity transaction = InventoryTransactionEntity.builder()
                .inventory(inventory)
                .type(TransactionType.IMPORT)
                .quantity(quantity)
                .unitCost(unitCost)
                .note("Import batch")
                .build();
        transaction.setId(UUID.randomUUID());
        return transaction;
    }

    private AverageImportCostProjection averageProjection(UUID variantId, BigDecimal averageImportCost) {
        return new AverageImportCostProjection() {
            @Override
            public UUID getVariantId() {
                return variantId;
            }

            @Override
            public BigDecimal getAverageImportCost() {
                return averageImportCost;
            }
        };
    }
}
