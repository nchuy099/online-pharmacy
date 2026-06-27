package com.nchuy099.SmartPharma.order.domain.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderAmountCalculator {

    private final InventoryTransactionRepository inventoryTransactionRepository;

    public BigDecimal calculateAmount(ProductVariantEntity variant, int qty) {
        return variant.getSalePrice().multiply(BigDecimal.valueOf(qty));
    }

    public BigDecimal calculateAmount(ProductVariantEntity variant, int qty, BigDecimal unitPriceOverride) {
        BigDecimal unitPrice = unitPriceOverride != null ? unitPriceOverride : variant.getSalePrice();
        return unitPrice.multiply(BigDecimal.valueOf(qty));
    }

    public BigDecimal calculateCartAmount(List<CartItemEntity> items) {
        return items.stream().map(CartItemEntity::calculateLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateItemsTotal(List<OrderItemEntity> items, BigDecimal shippingFee) {
        BigDecimal itemTotal = items.stream()
                .map(OrderItemEntity::calculateTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return itemTotal.add(shippingFee != null ? shippingFee : BigDecimal.ZERO);
    }

    public BigDecimal resolveUnitCost(ProductVariantEntity variant) {
        return resolveUnitCost(variant, null);
    }

    public BigDecimal resolveUnitCost(ProductVariantEntity variant, Map<UUID, BigDecimal> costCache) {
        if (variant == null) {
            return BigDecimal.ZERO;
        }
        if (variant.getAverageCost() != null) {
            return variant.getAverageCost();
        }
        if (variant.getLatestImportCost() != null) {
            return variant.getLatestImportCost();
        }
        return resolveUnitCost(variant.getId(), costCache);
    }

    public Map<UUID, BigDecimal> newCostCache() {
        return new HashMap<>();
    }

    private BigDecimal resolveUnitCost(UUID variantId, Map<UUID, BigDecimal> costCache) {
        if (variantId == null) {
            return BigDecimal.ZERO;
        }
        if (costCache != null && costCache.containsKey(variantId)) {
            return costCache.get(variantId);
        }

        BigDecimal cost = inventoryTransactionRepository
                .findTopByInventoryVariantIdAndTypeOrderByCreatedAtDesc(variantId, TransactionType.IMPORT)
                .map(t -> t.getUnitCost() != null ? t.getUnitCost() : BigDecimal.ZERO)
                .orElse(BigDecimal.ZERO);

        if (costCache != null) {
            costCache.put(variantId, cost);
        }
        return cost;
    }
}
