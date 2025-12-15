package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class OrderDetailResponseDTO {
    @JsonProperty("order_code")
    private String orderCode;

    @JsonProperty("status")
    private String status;

    @JsonProperty("from_name")
    private String fromName;

    @JsonProperty("from_phone")
    private String fromPhone;

    @JsonProperty("from_address")
    private String fromAddress;

    @JsonProperty("to_name")
    private String toName;

    @JsonProperty("to_phone")
    private String toPhone;

    @JsonProperty("to_address")
    private String toAddress;

    @JsonProperty("weight")
    private Integer weight;

    @JsonProperty("leadtime")
    private String leadtime;

    @JsonProperty("log")
    private List<LogEntryDTO> log;

    @Data
    public static class LogEntryDTO {
        @JsonProperty("status")
        private String status;

        @JsonProperty("updated_date")
        private String updatedDate;
    }
}
