package com.nchuy099.SmartPharma.inventory.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryTransactionEntity;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventoryRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class InventoryDomainService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductVariantRepository productVariantRepository;

    public InventoryEntity getInventory(String variantId) {
        UUID vid;
        try {
            vid = UUID.fromString(variantId);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid variantId: " + variantId);
        }
        return inventoryRepository.findByVariant_Id(vid)
                .orElseGet(() -> {
                    log.info("Inventory not found for variant {}, creating default for testing", variantId);
                    productVariantRepository.findById(vid)
                            .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "ProductVariant not found"));
                    inventoryRepository.insertDefaultInventory(vid);
                    return inventoryRepository.findByVariant_Id(vid)
                            .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory not found"));
                });
    }

    public Map<UUID, InventoryEntity> getInventoriesByVariantIds(Collection<UUID> variantIds) {
        if (variantIds == null || variantIds.isEmpty()) {
            return Map.of();
        }

        return inventoryRepository.findAllByVariantIds(variantIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        inventory -> inventory.getVariant().getId(),
                        java.util.function.Function.identity(),
                        (left, right) -> left,
                        HashMap::new));
    }

    public void ensureCartAvailable(List<CartItemEntity> items) {
        items.forEach(item -> resolveInventory(item).ensureAvailable(item.getQuantity()));
    }

    public void ensureAvailable(InventoryEntity inv, int qty) {
        inv.ensureAvailable(qty);
    }

    public void reserve(InventoryEntity inv, int qty) {
        validateQuantity(qty);
        UUID inventoryId = requireInventoryId(inv);
        applyAtomicUpdate(inventoryRepository.reserveQuantity(inventoryId, qty),
                "Not enough stock to reserve");
        saveTransaction(inventoryId, TransactionType.RESERVE, qty, null, "Reserve Stock");
    }

    public void reserveCart(List<CartItemEntity> items) {
        items.forEach(item -> reserve(resolveInventory(item), item.getQuantity()));
    }

    public void ensureReserved(List<CartItemEntity> items) {
        items.forEach(item -> resolveInventory(item).ensureReserved(item.getQuantity()));
    }

    public void importStock(InventoryEntity inv, int qty, BigDecimal unitCost, String note) {
        validateQuantity(qty);
        UUID inventoryId = requireInventoryId(inv);
        ProductVariantEntity variant = inv.getVariant();
        BigDecimal normalizedUnitCost = normalizeUnitCost(unitCost);
        BigDecimal currentAverageCost = resolveCurrentAverageCost(inv);
        BigDecimal currentQuantity = BigDecimal.valueOf(inv.getQuantityOnHand() != null ? inv.getQuantityOnHand() : 0);
        BigDecimal importedQuantity = BigDecimal.valueOf(qty);
        BigDecimal totalQuantity = currentQuantity.add(importedQuantity);
        BigDecimal weightedAverageCost = totalQuantity.compareTo(BigDecimal.ZERO) > 0
                ? currentAverageCost.multiply(currentQuantity)
                        .add(normalizedUnitCost.multiply(importedQuantity))
                        .divide(totalQuantity, 2, RoundingMode.HALF_UP)
                : normalizedUnitCost;

        applyAtomicUpdate(inventoryRepository.incrementQuantityOnHand(inventoryId, qty),
                "Inventory not found");
        variant.setLatestImportCost(normalizedUnitCost);
        variant.setAverageCost(weightedAverageCost);
        productVariantRepository.save(variant);
        saveTransaction(inventoryId, TransactionType.IMPORT, qty, normalizeUnitCost(unitCost), note);
    }

    public void export(InventoryEntity inv, int qty) {
        validateQuantity(qty);
        UUID inventoryId = requireInventoryId(inv);
        applyAtomicUpdate(inventoryRepository.exportQuantity(inventoryId, qty),
                "Not enough reserved stock to export");
        saveTransaction(inventoryId, TransactionType.EXPORT, qty, null, "Export stock");
    }

    public void release(InventoryEntity inv, int qty) {
        validateQuantity(qty);
        UUID inventoryId = requireInventoryId(inv);
        applyAtomicUpdate(inventoryRepository.releaseReservation(inventoryId, qty),
                "Not enough reserved stock to release");
        saveTransaction(inventoryId, TransactionType.RELEASE, qty, null, "Release reserved stock");
    }

    public void exportCart(List<CartItemEntity> items) {
        items.forEach(item -> export(resolveInventory(item), item.getQuantity()));
    }

    public void reserveOrder(OrderEntity order) {
        order.getItems().forEach(item -> reserve(resolveInventory(item), item.getQuantity()));
    }

    public void exportOrder(OrderEntity order) {
        if (order.getStockExported() != null && order.getStockExported()) {
            log.info("Stock already exported for order: {}", order.getOrderCode());
            return;
        }

        order.getItems().forEach(item -> export(resolveInventory(item), item.getQuantity()));

        order.setStockExported(true);
    }

    private InventoryEntity resolveInventory(CartItemEntity item) {
        if (item == null || item.getVariant() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cart item variant is required");
        }

        InventoryEntity inventory = item.getVariant().getInventory();
        if (inventory != null) {
            return inventory;
        }
        return getInventory(item.getVariant().getId().toString());
    }

    private InventoryEntity resolveInventory(com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity item) {
        if (item == null || item.getVariant() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Order item variant is required");
        }

        InventoryEntity inventory = item.getVariant().getInventory();
        if (inventory != null) {
            return inventory;
        }
        return getInventory(item.getVariant().getId().toString());
    }

    private UUID requireInventoryId(InventoryEntity inv) {
        if (inv == null || inv.getId() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Inventory is required");
        }
        return inv.getId();
    }

    private void applyAtomicUpdate(int rowsAffected, String conflictMessage) {
        if (rowsAffected <= 0) {
            throw new AppException(ErrorCode.CONFLICT, conflictMessage);
        }
    }

    private void validateQuantity(int qty) {
        if (qty <= 0) {
            throw new AppException(ErrorCode.CONFLICT, "Quantity must be > 0");
        }
    }

    private void saveTransaction(UUID inventoryId, TransactionType type, int qty, BigDecimal unitCost, String note) {
        InventoryEntity inventoryRef = inventoryRepository.getReferenceById(inventoryId);
        inventoryTransactionRepository.save(InventoryTransactionEntity.builder()
                .inventory(inventoryRef)
                .quantity(qty)
                .type(type)
                .unitCost(type == TransactionType.IMPORT ? normalizeUnitCost(unitCost) : null)
                .note(note)
                .build());
    }

    private BigDecimal normalizeUnitCost(BigDecimal unitCost) {
        if (unitCost != null && unitCost.compareTo(BigDecimal.ZERO) >= 0) {
            return unitCost;
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal resolveCurrentAverageCost(InventoryEntity inv) {
        ProductVariantEntity variant = inv.getVariant();
        if (variant.getAverageCost() != null) {
            return variant.getAverageCost();
        }

        BigDecimal averagedCost = inventoryTransactionRepository.findAverageImportCostByVariantId(variant.getId());
        if (averagedCost != null) {
            return averagedCost;
        }

        if (variant.getLatestImportCost() != null) {
            return variant.getLatestImportCost();
        }

        return BigDecimal.ZERO;
    }

}
