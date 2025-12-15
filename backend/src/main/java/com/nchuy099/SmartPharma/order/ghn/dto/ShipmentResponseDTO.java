package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ShipmentResponseDTO {
    @JsonProperty("order_code")
    private String orderCode;
    @JsonProperty("expected_delivery_time")
    private String expectedDeliveryTime;
    @JsonProperty("total_fee")
    private Integer totalFee;
}
