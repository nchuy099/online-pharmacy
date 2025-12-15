package com.nchuy099.SmartPharma.order.ghn.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ShipmentRequestDTO {
    @JsonProperty("payment_type_id")
    private Integer paymentTypeId;
    private String note;
    @JsonProperty("required_note")
    private String requiredNote;
    @JsonProperty("return_phone")
    private String returnPhone;
    @JsonProperty("return_address")
    private String returnAddress;
    @JsonProperty("to_name")
    private String toName;
    @JsonProperty("to_phone")
    private String toPhone;
    @JsonProperty("to_address")
    private String toAddress;
    @JsonProperty("to_ward_name")
    private String toWardName;
    @JsonProperty("to_district_name")
    private String toDistrictName;
    @JsonProperty("to_province_name")
    private String toProvinceName;
    @JsonProperty("to_ward_code")
    private String toWardCode;
    @JsonProperty("to_district_id")
    private Integer toDistrictId;
    @JsonProperty("cod_amount")
    private Integer codAmount;
    private String content;
    private Integer weight;
    private Integer length;
    private Integer width;
    private Integer height;
    @JsonProperty("service_type_id")
    private Integer serviceTypeId;
    @JsonProperty("service_id")
    private Integer serviceId;
    private List<ItemDTO> items;

    @Data
    @Builder
    public static class ItemDTO {
        private String name;
        private Integer quantity;
        private Integer price;
        private Integer weight;
    }
}
