package com.nchuy099.SmartPharma.flashsale.dto.response;

import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class FlashSaleClaimResponse {
    private UUID reservationId;
    private Integer quantity;
    private Integer remainingStock;
    private Instant expiresAt;
    private FlashSaleItemResponse item;
}
