package com.nchuy099.SmartPharma.order.ghn.dto;

import lombok.Data;

@Data
public class FeeResponseDTO {
    private Integer total;
    private Integer service_fee;
    private Integer insurance_fee;
}
