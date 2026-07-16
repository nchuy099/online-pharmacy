package com.nchuy099.SmartPharma.order.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

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
public class OrderResponse {

    String id;

    String paymentMethod;

    PaymentDto payment;

    String status;

    AddressDto address;

    List<OrderItemDto> items;

    @com.fasterxml.jackson.annotation.JsonProperty("itemTotalAmount")
    BigDecimal itemTotalAmount;

    @com.fasterxml.jackson.annotation.JsonProperty("finalAmount")
    BigDecimal finalAmount;



    BigDecimal shippingFee;

    String shippingAddress;

    String ghnOrderCode;

    String note;
    String orderCode;
    String paymentUrl;
    String bankName;
    String bankAccount;
    Long expectedDeliveryTime;
    java.time.Instant deliveredAt;
    java.time.Instant returnCompletedAt;
    ReturnRequestDto returnRequest;
    ShipmentInfoDto shipment;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ShipmentInfoDto {
        @JsonProperty("order_code")
        private String orderCode;

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

        private Integer weight;
        private String leadtime;
        private List<ShipmentLogDto> log;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ShipmentLogDto {
        private String status;
        @JsonProperty("updated_date")
        private String updatedDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class OrderItemDto {
        private String id;
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
        private java.util.UUID flashSaleReservationId;
        private ReviewDto review;

        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        @FieldDefaults(level = AccessLevel.PRIVATE)
        public static class ReviewDto {
            private String id;
            private Integer rating;
            private String comment;
            private java.time.Instant createdAt;
            private boolean canEdit;
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class AddressDto {
        private String fullName;
        private String phoneNumber;
        private String address;
        private String provinceName;
        private String districtName;
        private String wardName;
        private String fullAddress;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class PaymentDto {
        private String method;
        private String status;
        private BigDecimal amount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ReturnRequestDto {
        private String id;
        private String status;
        private String reason;
        private String reviewNote;
        private BigDecimal refundAmount;
        private java.time.Instant requestedAt;
        private java.time.Instant reviewedAt;
        private List<String> imageUrls;
    }
}
