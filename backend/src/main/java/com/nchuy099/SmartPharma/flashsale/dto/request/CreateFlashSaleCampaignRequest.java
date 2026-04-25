package com.nchuy099.SmartPharma.flashsale.dto.request;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleCampaignType;
import com.nchuy099.SmartPharma.flashsale.domain.FlashSaleSlot;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateFlashSaleCampaignRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    private LocalDate campaignDate;

    @NotNull
    private FlashSaleSlot slotCode;

    @NotNull
    private FlashSaleCampaignType type = FlashSaleCampaignType.NORMAL;

    private String coverImage;

    @Valid
    @NotEmpty(message = "Flash sale must contain at least one item")
    private List<ItemRequest> items;

    @Getter
    @Setter
    public static class ItemRequest {
        @NotNull(message = "Variant is required")
        private UUID variantId;

        @NotNull(message = "Flash price is required")
        @Positive(message = "Flash price must be greater than 0")
        private java.math.BigDecimal flashPrice;

        @NotNull(message = "Sale stock is required")
        @Positive(message = "Sale stock must be greater than 0")
        private Integer saleStock;

        @NotNull(message = "Per user limit is required")
        @Positive(message = "Per user limit must be greater than 0")
        private Integer perUserLimit = 1;
    }
}
