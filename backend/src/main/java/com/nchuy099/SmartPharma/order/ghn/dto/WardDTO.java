package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class WardDTO {
    @JsonProperty("WardCode")
    private String wardCode;
    @JsonProperty("DistrictID")
    private Integer districtId;
    @JsonProperty("WardName")
    private String wardName;
}
