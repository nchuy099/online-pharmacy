package com.nchuy099.SmartPharma.inventory.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.nchuy099.SmartPharma.common.dto.Pagination;

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
public class TransactionPageResponse {

    UUID productId;
    String productName;
    String productWebName;
    String productCode;
    String productSlug;
    UUID variantId;
    String variantSku;
    String unitType;
    String specification;
    Integer quantityOnHand;
    Integer quantityAvailable;
    Integer quantityReserved;
    BigDecimal salePrice;
    BigDecimal averageImportCost;

    List<InventoryResponse> inventories;
    List<TransactionResponse> transactions;

    Pagination pagination;
}
