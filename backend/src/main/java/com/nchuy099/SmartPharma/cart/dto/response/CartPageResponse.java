package com.nchuy099.SmartPharma.cart.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.nchuy099.SmartPharma.common.dto.Cursor;

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
public class CartPageResponse {
    List<CartItemResponse> items;
    Cursor cursor;

    Integer totalDistinctItems;
    CartSummaryResponse selectedSummary;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class CartSummaryResponse {
        Integer totalDistinctItems;
        BigDecimal grandTotal;
    }
}
