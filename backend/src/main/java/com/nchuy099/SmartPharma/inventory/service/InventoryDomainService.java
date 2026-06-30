package com.nchuy099.SmartPharma.inventory.service;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.dto.request.ImportStockRequest;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventoryRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Deprecated
public class InventoryDomainService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductVariantRepository productVariantRepository;

    public InventoryDomainService(
            InventoryRepository inventoryRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            ProductVariantRepository productVariantRepository) {
        this.inventoryRepository = inventoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productVariantRepository = productVariantRepository;
    }

    public InventoryEntity getInventory(String variantId) {
        UUID vid = UUID.fromString(variantId);
        return inventoryRepository.findByVariantId(vid)
                .map(this::copy)
                .orElseGet(() -> {
                    productVariantRepository.findById(vid)
                            .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "ProductVariant not found"));
                    inventoryRepository.insertDefaultSummary(vid);
                    return inventoryRepository.findByVariantId(vid).map(this::copy)
                            .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory not found"));
                });
    }

    public Map<UUID, InventoryEntity> getInventoriesByVariantIds(Collection<UUID> variantIds) {
        Map<UUID, InventoryEntity> result = new HashMap<>();
        inventoryRepository.findAllByVariantIds(variantIds)
                .forEach(summary -> result.put(summary.getVariant().getId(), copy(summary)));
        return result;
    }

    public void ensureCartAvailable(List<CartItemEntity> items) {
        items.forEach(item -> ensureAvailable(getInventory(item.getVariant().getId().toString()), item.getQuantity()));
    }

    public void ensureAvailable(InventoryEntity inv, int qty) {
        if (inv.getQuantityAvailable() < qty) {
            throw new AppException(ErrorCode.CONFLICT, "Product stock not enough to proceed");
        }
    }

    public void reserve(InventoryEntity inv, int qty) {
        ensureAvailable(inv, qty);
        inv.setQuantityReserved(inv.getQuantityReserved() + qty);
    }

    public void reserveCart(List<CartItemEntity> items) {
        items.forEach(item -> reserve(getInventory(item.getVariant().getId().toString()), item.getQuantity()));
    }

    public void ensureReserved(List<CartItemEntity> items) {
        items.forEach(item -> {
            InventoryEntity inventory = getInventory(item.getVariant().getId().toString());
            if (inventory.getQuantityReserved() < item.getQuantity()) {
                throw new AppException(ErrorCode.CONFLICT, "Product stock not enough to reserve");
            }
        });
    }

    public void importStock(InventoryEntity inv, int qty, BigDecimal unitCost, String note) {
        inv.setQuantityOnHand(inv.getQuantityOnHand() + qty);
    }

    public void export(InventoryEntity inv, int qty) {
        if (inv.getQuantityReserved() < qty) {
            throw new AppException(ErrorCode.CONFLICT, "Not enough reserved stock to export");
        }
        inv.setQuantityReserved(inv.getQuantityReserved() - qty);
        inv.setQuantityOnHand(inv.getQuantityOnHand() - qty);
    }

    public void release(InventoryEntity inv, int qty) {
        if (inv.getQuantityReserved() < qty) {
            throw new AppException(ErrorCode.CONFLICT, "Not enough reserved stock to release");
        }
        inv.setQuantityReserved(inv.getQuantityReserved() - qty);
    }

    public void exportCart(List<CartItemEntity> items) {
        items.forEach(item -> export(getInventory(item.getVariant().getId().toString()), item.getQuantity()));
    }

    public void reserveOrder(OrderEntity order) {
        order.getItems().forEach(item -> reserve(getInventory(item.getVariant().getId().toString()), item.getQuantity()));
    }

    public void exportOrder(OrderEntity order) {
        order.getItems().forEach(item -> export(getInventory(item.getVariant().getId().toString()), item.getQuantity()));
        order.setStockExported(true);
    }

    private InventoryEntity copy(InventorySummaryEntity summary) {
        InventoryEntity inventory = new InventoryEntity();
        inventory.setId(summary.getId());
        inventory.setVariant(summary.getVariant());
        inventory.setQuantityOnHand(summary.getQuantityOnHand());
        inventory.setQuantityReserved(summary.getQuantityReserved());
        inventory.setReorderLevel(summary.getReorderLevel());
        inventory.setSafetyStock(summary.getSafetyStock());
        return inventory;
    }
}
