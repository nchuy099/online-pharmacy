package com.nchuy099.SmartPharma.cart.dto.response;

import java.math.BigDecimal;

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
public class CartItemResponse {

    String id;
    Boolean selected;
    ProductInfoResponse productInfo;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ProductInfoResponse {
        String productId;
        String variantId;
        String name;
        String webName;
        String slug;
        String sku;
        String unit;
        BigDecimal unitPrice;
        Integer quantity;
        String imageUrl;
        Integer availableQuantity;
    }
}
