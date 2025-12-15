package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class LeadTimeResponseDTO {
    @JsonProperty("leadtime")
    private Long leadtime;

    @JsonProperty("order_date")
    private Long orderDate;
}
