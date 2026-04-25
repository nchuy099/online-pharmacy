package com.nchuy099.SmartPharma.flashsale.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;

@Getter
@Setter
public class GenerateRandomFlashSaleCampaignRequest {

    private String name;

    private String description;

    private FlashSaleCampaignType type = FlashSaleCampaignType.NORMAL;

    private String coverImage;

    @Positive
    private Integer itemCount = 10;

    @Positive
    private Integer saleStockPerItem = 10;

    @Positive
    private Integer perUserLimit = 1;

    @Positive
    private BigDecimal discountPercent = BigDecimal.valueOf(20);
}
