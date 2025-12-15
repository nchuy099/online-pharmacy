package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class DistrictDTO {
    @JsonProperty("DistrictID")
    private Integer districtId;
    @JsonProperty("ProvinceID")
    private Integer provinceId;
    @JsonProperty("DistrictName")
    private String districtName;
}
