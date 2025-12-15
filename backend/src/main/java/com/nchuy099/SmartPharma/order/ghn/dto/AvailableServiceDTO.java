package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AvailableServiceDTO {
    @JsonProperty("service_id")
    private Integer serviceId;
    @JsonProperty("short_name")
    private String shortName;
    @JsonProperty("service_type_id")
    private Integer serviceTypeId;
}
