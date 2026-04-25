package com.nchuy099.SmartPharma.flashsale.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FlashSaleReservationView {
    private UUID reservationId;
    private UUID itemId;
    private UUID userId;
    private UUID variantId;
    private Integer quantity;
    private BigDecimal flashPrice;
    private Integer perUserLimit;
    private Instant expiresAt;
    private String status;
}
