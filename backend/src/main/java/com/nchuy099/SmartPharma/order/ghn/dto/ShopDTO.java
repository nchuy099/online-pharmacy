package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ShopDTO {
    @JsonProperty("_id")
    private Integer id;

    private String name;
    private String phone;
    private String address;

    @JsonProperty("ward_code")
    private String wardCode;

    @JsonProperty("district_id")
    private Integer districtId;

    @JsonProperty("client_id")
    private Integer clientId;

    private Integer status;
}
