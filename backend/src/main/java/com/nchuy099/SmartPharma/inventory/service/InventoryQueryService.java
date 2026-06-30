package com.nchuy099.SmartPharma.inventory.service;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryLotStatus;
import com.nchuy099.SmartPharma.inventory.dto.response.ImportStockResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryLotPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryLotResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionResponse;
import com.nchuy099.SmartPharma.inventory.entity.InventoryLotEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryTransactionEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventoryLotRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class InventoryQueryService {

    private final InventorySummaryRepository inventorySummaryRepository;
    private final InventoryLotRepository inventoryLotRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    public InventoryQueryService(
            InventorySummaryRepository inventorySummaryRepository,
            InventoryLotRepository inventoryLotRepository,
            InventoryTransactionRepository inventoryTransactionRepository) {
        this.inventorySummaryRepository = inventorySummaryRepository;
        this.inventoryLotRepository = inventoryLotRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
    }

    public InventorySummaryEntity getInventorySummary(String variantId) {
        UUID variantUuid;
        try {
            variantUuid = UUID.fromString(variantId);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid variantId: " + variantId);
        }
        return inventorySummaryRepository.findByVariantId(variantUuid)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
    }

    public void validateAvailableStock(UUID variantId, int quantity) {
        InventorySummaryEntity summary = inventorySummaryRepository.findByVariantId(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
        if (quantity <= 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Quantity must be > 0");
        }
        if (summary.getQuantityAvailable() < quantity) {
            throw new AppException(ErrorCode.CONFLICT, "Product stock not enough to proceed");
        }
    }

    public int getAvailableQuantity(UUID variantId) {
        return inventorySummaryRepository.findByVariantId(variantId)
                .map(InventorySummaryEntity::getQuantityAvailable)
                .orElse(0);
    }

    public InventoryPageResponse getInventoryList(int page, int size, String search) {
        if (page > 0) {
            page--;
        }
        Pageable pageable = PageRequest.of(page, size);
        Page<InventorySummaryEntity> summaries = inventorySummaryRepository.findAllWithVariant(search, pageable);
        Map<UUID, BigDecimal> averageImportCosts = loadAverageImportCosts(summaries.getContent());
        return InventoryPageResponse.builder()
                .inventories(summaries.getContent().stream().map(summary -> mapInventory(summary, averageImportCosts)).toList())
                .pagination(Pagination.builder()
                        .page(page + 1)
                        .size(size)
                        .totalPages(summaries.getTotalPages())
                        .totalElements(summaries.getTotalElements())
                        .build())
                .build();
    }

    public TransactionResponse getTransactionDetails(String transactionId) {
        InventoryTransactionEntity transaction = inventoryTransactionRepository.findById(UUID.fromString(transactionId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Transaction not found"));
        ProductVariantEntity variant = resolveVariant(transaction);
        BigDecimal averageImportCost = resolveAverageImportCost(variant);
        return mapTransaction(transaction, variant, averageImportCost);
    }

    public TransactionPageResponse getTransactionList(String variantId, int page, int size) {
        UUID vid = UUID.fromString(variantId);
        InventorySummaryEntity summary = inventorySummaryRepository.findByVariantId(vid)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
        if (page > 0) {
            page--;
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InventoryTransactionEntity> transactions = inventoryTransactionRepository.findByInventorySummaryId(summary.getId(), pageable);
        ProductVariantEntity variant = summary.getVariant();
        BigDecimal averageImportCost = resolveAverageImportCost(variant);
        return TransactionPageResponse.builder()
                .productId(variant.getProduct().getId())
                .productName(variant.getProduct().getName())
                .productWebName(variant.getProduct().getWebName())
                .productCode(variant.getProduct().getCode())
                .productSlug(variant.getProduct().getSlug())
                .variantId(variant.getId())
                .variantSku(variant.getSku())
                .unitType(variant.getUnit())
                .specification(variant.getSpecification())
                .quantityOnHand(summary.getQuantityOnHand())
                .quantityAvailable(summary.getQuantityAvailable())
                .quantityReserved(summary.getQuantityReserved())
                .salePrice(variant.getSalePrice())
                .averageImportCost(averageImportCost)
                .inventories(java.util.List.of(mapInventory(summary, Map.of(variant.getId(), averageImportCost))))
                .transactions(transactions.getContent().stream()
                        .map(transaction -> mapTransaction(transaction, variant, averageImportCost))
                        .toList())
                .pagination(Pagination.builder()
                        .page(page + 1)
                        .size(size)
                        .totalPages(transactions.getTotalPages())
                        .totalElements(transactions.getTotalElements())
                        .build())
                .build();
    }

    public InventoryLotPageResponse getInventoryLots(String variantId, int page, int size, String search, String status) {
        UUID vid = UUID.fromString(variantId);
        InventorySummaryEntity summary = inventorySummaryRepository.findByVariantId(vid)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Inventory summary not found"));
        if (page > 0) {
            page--;
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(
                Sort.Order.asc("expiryDate"),
                Sort.Order.asc("receivedAt"),
                Sort.Order.asc("id")));
        InventoryLotStatus lotStatus = parseLotStatus(status);
        Page<InventoryLotEntity> lots = inventoryLotRepository.findPageByVariantId(vid, search, lotStatus, pageable);
        BigDecimal averageImportCost = resolveAverageImportCost(summary.getVariant());
        return InventoryLotPageResponse.builder()
                .summary(mapInventory(summary, Map.of(summary.getVariant().getId(), averageImportCost)))
                .lots(lots.getContent().stream().map(this::mapLot).toList())
                .pagination(Pagination.builder()
                        .page(page + 1)
                        .size(size)
                        .totalPages(lots.getTotalPages())
                        .totalElements(lots.getTotalElements())
                        .build())
                .build();
    }

    public ImportStockResponse getImportStockResponse(InventorySummaryEntity summary, InventoryLotEntity lot) {
        BigDecimal averageImportCost = resolveAverageImportCost(summary.getVariant());
        return ImportStockResponse.builder()
                .summary(mapInventory(summary, Map.of(summary.getVariant().getId(), averageImportCost)))
                .lot(mapLot(lot))
                .build();
    }

    private Map<UUID, BigDecimal> loadAverageImportCosts(Collection<InventorySummaryEntity> summaries) {
        Map<UUID, BigDecimal> result = new HashMap<>();
        var variantIds = summaries.stream().map(summary -> summary.getVariant().getId()).distinct().toList();
        if (variantIds.isEmpty()) {
            return result;
        }
        inventoryTransactionRepository.findAverageImportCostsByVariantIds(variantIds)
                .forEach(item -> result.put(item.getVariantId(), item.getAverageImportCost()));
        return result;
    }

    private InventoryResponse mapInventory(InventorySummaryEntity summary, Map<UUID, BigDecimal> averageImportCosts) {
        ProductVariantEntity variant = summary.getVariant();
        return InventoryResponse.builder()
                .id(summary.getId())
                .variantId(variant.getId())
                .productId(variant.getProduct().getId())
                .productName(variant.getProduct().getName())
                .productWebName(variant.getProduct().getWebName())
                .productCode(variant.getProduct().getCode())
                .productSlug(variant.getProduct().getSlug())
                .productSku(variant.getSku())
                .unitType(variant.getUnit())
                .specification(variant.getSpecification())
                .quantityOnHand(summary.getQuantityOnHand())
                .quantityReserved(summary.getQuantityReserved())
                .quantityAvailable(summary.getQuantityAvailable())
                .salePrice(variant.getSalePrice())
                .averageImportCost(averageImportCosts.getOrDefault(variant.getId(), resolveAverageImportCost(variant)))
                .build();
    }

    private InventoryLotResponse mapLot(InventoryLotEntity lot) {
        ProductVariantEntity variant = lot.getVariant();
        return InventoryLotResponse.builder()
                .id(lot.getId())
                .variantId(variant.getId())
                .productId(variant.getProduct().getId())
                .productName(variant.getProduct().getName())
                .productWebName(variant.getProduct().getWebName())
                .productCode(variant.getProduct().getCode())
                .productSlug(variant.getProduct().getSlug())
                .productSku(variant.getSku())
                .unitType(variant.getUnit())
                .specification(variant.getSpecification())
                .lotNumber(lot.getLotNumber())
                .expiryDate(lot.getExpiryDate())
                .receivedAt(lot.getReceivedAt())
                .quantityOnHand(lot.getQuantityOnHand())
                .quantityReserved(lot.getQuantityReserved())
                .quantityAvailable(lot.getQuantityAvailable())
                .status(resolveLotStatus(lot))
                .unitCost(lot.getUnitCost())
                .build();
    }

    private TransactionResponse mapTransaction(
            InventoryTransactionEntity transaction,
            ProductVariantEntity variant,
            BigDecimal averageImportCost) {
        return TransactionResponse.builder()
                .id(transaction.getId().toString())
                .productName(variant.getProduct().getName())
                .variantId(variant.getId())
                .variantSku(variant.getSku())
                .unitType(variant.getUnit())
                .specification(variant.getSpecification())
                .salePrice(variant.getSalePrice())
                .averageImportCost(averageImportCost)
                .lotId(transaction.getLot() != null ? transaction.getLot().getId() : null)
                .lotNumber(transaction.getLot() != null ? transaction.getLot().getLotNumber() : null)
                .type(transaction.getType().toString())
                .quantity(transaction.getQuantity())
                .unitCost(transaction.getUnitCost())
                .note(transaction.getNote())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private ProductVariantEntity resolveVariant(InventoryTransactionEntity transaction) {
        return transaction.getVariant() != null
                ? transaction.getVariant()
                : transaction.getInventorySummary().getVariant();
    }

    private String resolveLotStatus(InventoryLotEntity lot) {
        if (lot.getStatus() == InventoryLotStatus.ACTIVE
                && lot.getExpiryDate() != null
                && !lot.getExpiryDate().isBefore(LocalDate.now())
                && !lot.getExpiryDate().isAfter(LocalDate.now().plusDays(30))) {
            return "EXPIRING";
        }
        return lot.getStatus().name();
    }

    private InventoryLotStatus parseLotStatus(String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return null;
        }
        try {
            return InventoryLotStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid inventory lot status: " + status);
        }
    }

    private BigDecimal resolveAverageImportCost(ProductVariantEntity variant) {
        if (variant.getAverageCost() != null) {
            return variant.getAverageCost();
        }
        BigDecimal aggregatedAverage = inventoryTransactionRepository.findAverageImportCostByVariantId(variant.getId());
        if (aggregatedAverage != null) {
            return aggregatedAverage;
        }
        if (variant.getLatestImportCost() != null) {
            return variant.getLatestImportCost();
        }
        return BigDecimal.ZERO;
    }
}
