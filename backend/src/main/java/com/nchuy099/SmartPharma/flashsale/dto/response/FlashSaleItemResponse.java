package com.nchuy099.SmartPharma.flashsale.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleItemStatus;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class FlashSaleItemResponse {
    private String id;
    private String campaignId;
    private String campaignCode;
    private String campaignName;
    private String variantId;
    private String variantSku;
    private String variantUnitType;
    private String productId;
    private String productName;
    private String productSlug;
    private String productImage;
    private BigDecimal flashPrice;
    private BigDecimal originalPrice;
    private Integer saleStock;
    private Integer remainingStock;
    private Integer perUserLimit;
    private String variantSpecification;
    private Instant startAt;
    private Instant endAt;
    private FlashSaleItemStatus status;
}
