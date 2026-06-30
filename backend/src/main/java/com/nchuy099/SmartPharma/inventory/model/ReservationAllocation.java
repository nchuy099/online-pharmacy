package com.nchuy099.SmartPharma.inventory.model;

import java.math.BigDecimal;
import java.util.UUID;

public record ReservationAllocation(
        UUID lotId,
        int quantity,
        BigDecimal unitCost) {
}
