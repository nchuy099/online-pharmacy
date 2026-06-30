package com.nchuy099.SmartPharma.inventory.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryLotResponse {
    UUID id;
    UUID variantId;
    UUID productId;
    String productName;
    String productWebName;
    String productCode;
    String productSlug;
    String productSku;
    String unitType;
    String specification;
    String lotNumber;
    LocalDate expiryDate;
    Instant receivedAt;
    Integer quantityOnHand;
    Integer quantityReserved;
    Integer quantityAvailable;
    String status;
    BigDecimal unitCost;
}
