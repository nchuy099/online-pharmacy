package com.nchuy099.SmartPharma.flashsale.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignStatus;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSlot;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class FlashSaleCampaignResponse {
    private String id;
    private String code;
    private String name;
    private String description;
    private FlashSaleCampaignType type;
    private String coverImage;
    private LocalDate campaignDate;
    private FlashSaleSlot slotCode;
    private String slotLabel;
    private Instant startAt;
    private Instant endAt;
    private FlashSaleCampaignStatus status;
    private List<FlashSaleItemResponse> items;
}
