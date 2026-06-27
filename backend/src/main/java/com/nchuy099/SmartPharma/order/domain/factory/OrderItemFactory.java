package com.nchuy099.SmartPharma.order.domain.factory;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.order.domain.service.OrderAmountCalculator;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderItemFactory {

    private final OrderAmountCalculator orderAmountCalculator;

    public OrderItemEntity fromBuyNow(ProductVariantEntity variant, int qty, BigDecimal unitPriceOverride) {
        BigDecimal unitPrice = unitPriceOverride != null ? unitPriceOverride : variant.getSalePrice();
        BigDecimal amount = unitPrice.multiply(BigDecimal.valueOf(qty));

        return OrderItemEntity.builder()
                .unitPrice(unitPrice)
                .unitCost(orderAmountCalculator.resolveUnitCost(variant))
                .product(variant.getProduct())
                .variant(variant)
                .quantity(qty)
                .totalPrice(amount)
                .snapshotProductName(variant.getProduct().getName())
                .snapshotSku(variant.getSku())
                .snapshotUnit(variant.getUnit())
                .snapshotPrimaryImage(variant.getProduct().getPrimaryImage())
                .build();
    }

    public OrderItemEntity fromCartItem(CartItemEntity cartItem, Map<UUID, BigDecimal> unitCostCache) {
        return OrderItemEntity.builder()
                .product(cartItem.getVariant().getProduct())
                .variant(cartItem.getVariant())
                .unitPrice(cartItem.getVariant().getSalePrice())
                .unitCost(orderAmountCalculator.resolveUnitCost(cartItem.getVariant(), unitCostCache))
                .quantity(cartItem.getQuantity())
                .totalPrice(cartItem.calculateLineTotal())
                .snapshotProductName(cartItem.getVariant().getProduct().getName())
                .snapshotSku(cartItem.getVariant().getSku())
                .snapshotUnit(cartItem.getVariant().getUnit())
                .snapshotPrimaryImage(cartItem.getVariant().getProduct().getPrimaryImage())
                .build();
    }
}
