package com.nchuy099.SmartPharma.inventory.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class InventoryEntityTest {

    @Test
    void shouldInheritSummaryAvailabilityCalculation() {
        InventoryEntity inventory = new InventoryEntity();
        inventory.setQuantityOnHand(20);
        inventory.setQuantityReserved(4);

        assertEquals(16, inventory.getQuantityAvailable());
    }

    @Test
    void syncFromLotsShouldUpdateSummaryQuantities() {
        InventoryEntity inventory = new InventoryEntity();
        inventory.syncFromLots(15, 3);

        assertEquals(15, inventory.getQuantityOnHand());
        assertEquals(3, inventory.getQuantityReserved());
        assertEquals(12, inventory.getQuantityAvailable());
    }
}
