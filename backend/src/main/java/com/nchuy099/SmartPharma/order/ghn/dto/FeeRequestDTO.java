package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FeeRequestDTO {
    @JsonProperty("service_type_id")
    private Integer serviceTypeId;
    @JsonProperty("service_id")
    private Integer serviceId;
    @JsonProperty("from_district_id")
    private Integer fromDistrictId;
    @JsonProperty("from_ward_code")
    private String fromWardCode;
    @JsonProperty("to_district_id")
    private Integer toDistrictId;
    @JsonProperty("to_ward_code")
    private String toWardCode;
    private Integer height;
    private Integer length;
    private Integer weight;
    private Integer width;
    @JsonProperty("insurance_value")
    private Integer insuranceValue;
    private List<ItemDTO> items;

    @Data
    @Builder
    public static class ItemDTO {
        private String name;
        private Integer quantity;
        private Integer height;
        private Integer length;
        private Integer weight;
        private Integer width;
    }
}
