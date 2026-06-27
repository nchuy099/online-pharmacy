package com.nchuy099.SmartPharma.order.application.create;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleReservationView;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

import lombok.Builder;

@Builder
public record CheckoutContext(
        OrderMode mode,
        List<CartItemEntity> cartItems,
        ProductVariantEntity variant,
        Integer quantity,
        BigDecimal amount,
        BigDecimal unitPriceOverride,
        FlashSaleReservationView flashSaleReservation,
        UUID flashSaleReservationId) {
}
