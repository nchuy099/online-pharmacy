package com.nchuy099.SmartPharma.flashsale.dto.request;

import java.time.LocalDate;

import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSlot;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFlashSaleCampaignRequest {
    private String name;
    private String description;
    private LocalDate campaignDate;
    private FlashSaleSlot slotCode;
    private FlashSaleCampaignType type;
    private String coverImage;
}
