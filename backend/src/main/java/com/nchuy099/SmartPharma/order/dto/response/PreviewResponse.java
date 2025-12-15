package com.nchuy099.SmartPharma.order.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PreviewResponse {

    List<PreviewItemDto> items;

    BigDecimal shippingFee;

    UUID checkoutQuoteId;

    Long checkoutQuoteExpiresAt;

    @com.fasterxml.jackson.annotation.JsonProperty("itemTotalAmount")
    BigDecimal itemTotalAmount;

    @com.fasterxml.jackson.annotation.JsonProperty("finalAmount")
    BigDecimal finalAmount;




    List<ShippingMethodDto> shippingMethods;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ShippingMethodDto {
        private Integer serviceId;
        private Integer serviceTypeId;
        private String name;
        private BigDecimal fee;
        private Long expectedDeliveryTime;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class PreviewItemDto {
        private String productId;
        private String variantId;
        private String productName;
        private String productWebName;
        private String productSlug;
        private String sku;
        private String unit;
        private String productImageUrl;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
