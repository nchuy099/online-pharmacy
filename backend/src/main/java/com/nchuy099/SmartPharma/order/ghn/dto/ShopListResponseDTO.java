package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class ShopListResponseDTO {
    @JsonProperty("last_offset")
    private Integer lastOffset;

    private List<ShopDTO> shops;
}
