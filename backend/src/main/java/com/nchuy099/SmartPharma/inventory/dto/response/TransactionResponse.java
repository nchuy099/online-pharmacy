package com.nchuy099.SmartPharma.inventory.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
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
public class TransactionResponse {

    String id;
    String productName;
    UUID variantId;
    String variantSku;
    String unitType;
    String specification;
    BigDecimal salePrice;
    BigDecimal averageImportCost;
    UUID lotId;
    String lotNumber;
    String type;
    Integer quantity;
    BigDecimal unitCost;
    String note;
    Instant createdAt;
}
