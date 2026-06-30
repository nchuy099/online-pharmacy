package com.nchuy099.SmartPharma.inventory.service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryLotStatus;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReferenceType;
import com.nchuy099.SmartPharma.inventory.domain.enums.TransactionType;
import com.nchuy099.SmartPharma.inventory.dto.request.ImportStockRequest;
import com.nchuy099.SmartPharma.inventory.entity.InventoryLotEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryTransactionEntity;
import com.nchuy099.SmartPharma.inventory.model.ReservationAllocation;
import com.nchuy099.SmartPharma.inventory.repository.InventoryLotRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryCommandService {

    private final InventoryAllocationDomainService allocationDomainService;
    private final InventorySummarySyncService inventorySummarySyncService;
    private final InventorySummaryRepository inventorySummaryRepository;
    private final InventoryLotRepository inventoryLotRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductVariantRepository productVariantRepository;

    public InventoryCommandService(
            InventoryAllocationDomainService allocationDomainService,
            InventorySummarySyncService inventorySummarySyncService,
            InventorySummaryRepository inventorySummaryRepository,
            InventoryLotRepository inventoryLotRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            ProductVariantRepository productVariantRepository) {
        this.allocationDomainService = allocationDomainService;
        this.inventorySummarySyncService = inventorySummarySyncService;
        this.inventorySummaryRepository = inventorySummaryRepository;
        this.inventoryLotRepository = inventoryLotRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productVariantRepository = productVariantRepository;
    }

    @Transactional
    public InventoryLotEntity importLot(UUID variantId, ImportStockRequest request, UUID createdBy) {
        if (request.getLotNumber() == null || request.getLotNumber().isBlank() || request.getExpiryDate() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Lot number and expiry date are required");
        }
        ProductVariantEntity variant = productVariantRepository.findByIdWithProduct(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product variant not found"));
        InventorySummaryEntity summary = ensureSummary(variantId, variant);
        InventoryLotEntity lot = inventoryLotRepository
                .findByVariantIdAndLotNumberAndExpiryDate(variantId, request.getLotNumber().trim(), request.getExpiryDate())
                .orElseGet(() -> InventoryLotEntity.builder()
                        .variant(variant)
                        .lotNumber(request.getLotNumber().trim())
                        .expiryDate(request.getExpiryDate())
                        .receivedAt(Instant.now())
                        .status(InventoryLotStatus.ACTIVE)
                        .quantityOnHand(0)
                        .quantityReserved(0)
                        .build());

        lot.importStock(request.getQuantity(), normalizeUnitCost(request.getUnitCost()));
        InventoryLotEntity savedLot = inventoryLotRepository.save(lot);
        updateVariantCosts(variant, summary.getQuantityOnHand(), request.getQuantity(), normalizeUnitCost(request.getUnitCost()));
        saveTransaction(summary, variant, savedLot, TransactionType.IMPORT, request.getQuantity(),
                normalizeUnitCost(request.getUnitCost()), request.getNote(), InventoryReferenceType.MANUAL, null, createdBy);
        inventorySummarySyncService.sync(variantId);
        return savedLot;
    }

    @Transactional
    public List<ReservationAllocation> reserveStock(
            UUID variantId,
            int quantity,
            InventoryReferenceType referenceType,
            String referenceId,
            UUID createdBy) {
        InventorySummaryEntity summary = inventorySummaryRepository.findByVariantId(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
        List<ReservationAllocation> allocations = allocationDomainService.reserveByFefo(variantId, quantity);
        for (ReservationAllocation allocation : allocations) {
            InventoryLotEntity lot = inventoryLotRepository.getReferenceById(allocation.lotId());
            saveTransaction(summary, summary.getVariant(), lot, TransactionType.RESERVE, allocation.quantity(),
                    null, "Reserve stock", referenceType, referenceId, createdBy);
        }
        inventorySummarySyncService.sync(variantId);
        return allocations;
    }

    @Transactional
    public void releaseAllocations(
            UUID variantId,
            List<ReservationAllocation> allocations,
            InventoryReferenceType referenceType,
            String referenceId,
            UUID createdBy) {
        InventorySummaryEntity summary = inventorySummaryRepository.findByVariantId(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
        allocationDomainService.releaseAllocations(allocations);
        for (ReservationAllocation allocation : allocations) {
            InventoryLotEntity lot = inventoryLotRepository.getReferenceById(allocation.lotId());
            saveTransaction(summary, summary.getVariant(), lot, TransactionType.RELEASE, allocation.quantity(),
                    null, "Release reserved stock", referenceType, referenceId, createdBy);
        }
        inventorySummarySyncService.sync(variantId);
    }

    @Transactional
    public void exportAllocations(
            UUID variantId,
            List<ReservationAllocation> allocations,
            InventoryReferenceType referenceType,
            String referenceId,
            UUID createdBy) {
        InventorySummaryEntity summary = inventorySummaryRepository.findByVariantId(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
        allocationDomainService.exportAllocations(allocations);
        for (ReservationAllocation allocation : allocations) {
            InventoryLotEntity lot = inventoryLotRepository.getReferenceById(allocation.lotId());
            saveTransaction(summary, summary.getVariant(), lot, TransactionType.EXPORT, allocation.quantity(),
                    null, "Export stock", referenceType, referenceId, createdBy);
        }
        inventorySummarySyncService.sync(variantId);
    }

    private InventorySummaryEntity ensureSummary(UUID variantId, ProductVariantEntity variant) {
        return inventorySummaryRepository.findByVariantId(variantId).orElseGet(() -> {
            inventorySummaryRepository.insertDefaultSummary(variantId);
            return inventorySummaryRepository.findByVariantId(variantId)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
        });
    }

    private void saveTransaction(
            InventorySummaryEntity summary,
            ProductVariantEntity variant,
            InventoryLotEntity lot,
            TransactionType type,
            int quantity,
            BigDecimal unitCost,
            String note,
            InventoryReferenceType referenceType,
            String referenceId,
            UUID createdBy) {
        inventoryTransactionRepository.save(InventoryTransactionEntity.builder()
                .inventorySummary(summary)
                .variant(variant)
                .lot(lot)
                .type(type)
                .quantity(quantity)
                .unitCost(unitCost)
                .note(note)
                .referenceType(referenceType != null ? referenceType.name() : null)
                .referenceId(parseReferenceId(referenceId))
                .createdBy(createdBy)
                .build());
    }

    private void updateVariantCosts(ProductVariantEntity variant, int currentOnHand, int importedQuantity, BigDecimal importedUnitCost) {
        BigDecimal currentAverage = variant.getAverageCost() != null ? variant.getAverageCost() : BigDecimal.ZERO;
        BigDecimal currentQty = BigDecimal.valueOf(Math.max(currentOnHand, 0));
        BigDecimal importQty = BigDecimal.valueOf(importedQuantity);
        BigDecimal totalQty = currentQty.add(importQty);
        BigDecimal average = totalQty.signum() > 0
                ? currentAverage.multiply(currentQty)
                        .add(importedUnitCost.multiply(importQty))
                        .divide(totalQty, 2, RoundingMode.HALF_UP)
                : importedUnitCost;
        variant.setLatestImportCost(importedUnitCost);
        variant.setAverageCost(average);
        productVariantRepository.save(variant);
    }

    private BigDecimal normalizeUnitCost(BigDecimal unitCost) {
        if (unitCost != null && unitCost.compareTo(BigDecimal.ZERO) >= 0) {
            return unitCost;
        }
        return BigDecimal.ZERO;
    }

    private UUID parseReferenceId(String referenceId) {
        if (referenceId == null || referenceId.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(referenceId);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
