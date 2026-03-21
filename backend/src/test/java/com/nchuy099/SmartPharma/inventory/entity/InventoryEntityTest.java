package com.nchuy099.SmartPharma.inventory.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;

class InventoryEntityTest {

    @Test
    void reserveShouldIncreaseReservedAndCreateReserveTransaction() {
        InventoryEntity inventory = InventoryEntity.builder()
                .quantityOnHand(20)
                .quantityReserved(4)
                .build();

        inventory.reserve(5);

        assertEquals(9, inventory.getQuantityReserved());
        assertEquals(11, inventory.getQuantityAvailable());
        assertEquals(1, inventory.getTransactions().size());
        assertEquals(TransactionType.RESERVE, inventory.getTransactions().get(0).getType());
        assertEquals(5, inventory.getTransactions().get(0).getQuantity());
    }

    @Test
    void importStockShouldDefaultUnitCostToZeroWhenNull() {
        InventoryEntity inventory = InventoryEntity.builder()
                .quantityOnHand(3)
                .quantityReserved(1)
                .build();

        inventory.importStock(7, null, "import batch");

        assertEquals(10, inventory.getQuantityOnHand());
        assertEquals(1, inventory.getTransactions().size());
        assertEquals(TransactionType.IMPORT, inventory.getTransactions().get(0).getType());
        assertEquals(BigDecimal.ZERO, inventory.getTransactions().get(0).getUnitCost());
    }

    @Test
    void exportStockShouldThrowWhenReservedNotEnough() {
        InventoryEntity inventory = InventoryEntity.builder()
                .quantityOnHand(15)
                .quantityReserved(2)
                .build();

        assertThrows(AppException.class, () -> inventory.exportStock(3));
    }
}
