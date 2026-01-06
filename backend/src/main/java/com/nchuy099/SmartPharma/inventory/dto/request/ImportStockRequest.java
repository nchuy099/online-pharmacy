package com.nchuy099.SmartPharma.inventory.dto.request;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImportStockRequest {
    private int quantity;
    private BigDecimal unitCost;
    private String note;
}
