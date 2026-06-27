package com.nchuy099.SmartPharma.order.application.create;

import java.util.List;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;

import lombok.Builder;

@Builder
public record CheckoutResult(
        OrderEntity order,
        List<CartItemEntity> cartItems) {
}
