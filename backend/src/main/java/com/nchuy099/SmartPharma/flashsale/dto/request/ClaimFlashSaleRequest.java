package com.nchuy099.SmartPharma.flashsale.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClaimFlashSaleRequest {
    @Min(1)
    private int quantity = 1;

    @NotBlank
    private String idempotencyKey;
}
