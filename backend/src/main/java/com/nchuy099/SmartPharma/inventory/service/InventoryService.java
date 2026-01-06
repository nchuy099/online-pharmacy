package com.nchuy099.SmartPharma.inventory.service;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.dto.request.ImportStockRequest;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionResponse;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventoryTransactionEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.inventory.repository.InventoryRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class InventoryService {

        private final InventoryRepository inventoryRepository;
        private final InventoryTransactionRepository inventoryTransactionRepository;
        private final InventoryDomainService inventoryDomainService;

        @Transactional
        public void importStock(String variantId, ImportStockRequest req) {
                log.info("Processing import stock request for variant: {}", variantId);

                InventoryEntity inventory = inventoryRepository.findByVariant_Id(UUID.fromString(variantId))
                                .orElseThrow(() -> {
                                        log.warn("Inventory not found for variant: {}", variantId);
                                        throw new AppException(ErrorCode.NOT_FOUND, "Inventory not found");
                                });

                inventoryDomainService.importStock(inventory, req.getQuantity(), req.getUnitCost(), req.getNote());
        }

        public TransactionResponse getTransactionDetails(String transactionId) {
                log.info("Processing get transaction details request");

                InventoryTransactionEntity transaction = inventoryTransactionRepository
                                .findById(UUID.fromString(transactionId))
                                .orElseThrow(() -> {
                                        log.warn("Transaction not found");
                                        throw new AppException(ErrorCode.NOT_FOUND, "Transaction not found");
                                });

                ProductVariantEntity variant = transaction.getInventory().getVariant();
                BigDecimal averageImportCost = resolveAverageImportCost(variant, transaction.getInventory());

                return TransactionResponse.builder()
                                .id(transactionId)
                                .productName(variant.getProduct().getName())
                                .variantId(variant.getId())
                                .variantSku(variant.getSku())
                                .unitType(variant.getUnit())
                                .specification(variant.getSpecification())
                                .salePrice(variant.getSalePrice())
                                .averageImportCost(averageImportCost)
                                .type(transaction.getType().toString())
                                .quantity(transaction.getQuantity())
                                .unitCost(transaction.getUnitCost())
                                .note(transaction.getNote())
                                .createdAt(transaction.getCreatedAt())
                                .build();
        }

        public TransactionPageResponse getTransactionList(String variantId, int page, int size) {
                log.info("Processing get transaction list request for variant: {}", variantId);

                UUID vid = UUID.fromString(variantId);
                InventoryEntity inventory = inventoryRepository.findByVariant_Id(vid)
                                .orElseThrow(() -> {
                                        log.warn("Inventory not found for variant: {}", variantId);
                                        throw new AppException(ErrorCode.NOT_FOUND, "Inventory not found");
                                });

                if (page > 0)
                        page--;

                Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
                Pageable pageable = PageRequest.of(page, size, sort);
                Page<InventoryTransactionEntity> transactions = inventoryTransactionRepository.findByInventoryId(inventory.getId(), pageable);

                ProductVariantEntity variant = inventory.getVariant();
                var product = variant.getProduct();
                BigDecimal averageImportCost = resolveAverageImportCost(variant, inventory);

                return TransactionPageResponse.builder()
                                .productId(product.getId())
                                .productName(product.getName())
                                .productWebName(product.getWebName())
                                .productCode(product.getCode())
                                .productSlug(product.getSlug())
                                .variantId(variant.getId())
                                .variantSku(variant.getSku())
                                .unitType(variant.getUnit())
                                .specification(variant.getSpecification())
                                .quantityOnHand(inventory.getQuantityOnHand())
                                .quantityAvailable(inventory.getQuantityAvailable())
                                .quantityReserved(inventory.getQuantityReserved())
                                .salePrice(variant.getSalePrice())
                                .averageImportCost(averageImportCost)
                                .inventories(java.util.List.of(mapInventory(inventory, java.util.Map.of(variant.getId(), averageImportCost))))
                                .transactions(transactions.getContent().stream()
                                                .map(trans -> {
                                                        ProductVariantEntity rowVariant = trans.getInventory().getVariant();
                                                        return TransactionResponse.builder()
                                                                        .id(trans.getId().toString())
                                                                        .productName(rowVariant.getProduct().getName())
                                                                        .variantId(rowVariant.getId())
                                                                        .variantSku(rowVariant.getSku())
                                                                        .unitType(rowVariant.getUnit())
                                                                        .specification(rowVariant.getSpecification())
                                                                        .salePrice(rowVariant.getSalePrice())
                                                                        .averageImportCost(averageImportCost)
                                                                        .type(trans.getType().toString())
                                                                        .quantity(trans.getQuantity())
                                                                        .unitCost(trans.getUnitCost())
                                                                        .note(trans.getNote())
                                                                        .createdAt(trans.getCreatedAt())
                                                                        .build();
                                                })
                                                .toList())
                                .pagination(Pagination.builder()
                                                .page(page + 1)
                                                .size(size)
                                                .totalPages(transactions.getTotalPages())
                                                .totalElements(transactions.getTotalElements())
                                                .build())
                                .build();
        }

        public InventoryPageResponse getInventoryList(int page, int size, String search) {
                log.info("Processing get inventory list request");

                if (page > 0)
                        page--;
                Pageable pageable = PageRequest.of(page, size);

                Page<InventoryEntity> inventories = inventoryRepository.findAllWithVariant(search, pageable);
                Map<UUID, BigDecimal> averageImportCosts = loadAverageImportCosts(inventories.getContent());

                return InventoryPageResponse.builder()
                                .inventories(inventories.getContent().stream().map(inventory -> mapInventory(inventory, averageImportCosts)).toList())
                                .pagination(Pagination.builder()
                                                .page(page + 1)
                                                .size(size)
                                                .totalPages(inventories.getTotalPages())
                                                .totalElements(inventories.getTotalElements())
                                                .build())
                                .build();
        }

        private Map<UUID, BigDecimal> loadAverageImportCosts(Collection<InventoryEntity> inventories) {
                Map<UUID, BigDecimal> result = new HashMap<>();
                var variantIds = inventories.stream()
                                .map(inventory -> inventory.getVariant().getId())
                                .distinct()
                                .toList();

                if (variantIds.isEmpty()) {
                        return result;
                }

                inventoryTransactionRepository.findAverageImportCostsByVariantIds(variantIds)
                                .forEach(item -> result.put(item.getVariantId(), item.getAverageImportCost()));
                return result;
        }

        private InventoryResponse mapInventory(InventoryEntity inventory, Map<UUID, BigDecimal> averageImportCosts) {
                ProductVariantEntity variant = inventory.getVariant();
                return InventoryResponse.builder()
                                .id(inventory.getId())
                                .variantId(variant.getId())
                                .productId(variant.getProduct().getId())
                                .productName(variant.getProduct().getName())
                                .productWebName(variant.getProduct().getWebName())
                                .productCode(variant.getProduct().getCode())
                                .productSlug(variant.getProduct().getSlug())
                                .productSku(variant.getSku())
                                .unitType(variant.getUnit())
                                .specification(variant.getSpecification())
                                .quantityOnHand(inventory.getQuantityOnHand())
                                .quantityReserved(inventory.getQuantityReserved())
                                .quantityAvailable(inventory.getQuantityAvailable())
                                .salePrice(variant.getSalePrice())
                                .averageImportCost(resolveAverageImportCost(variant, inventory, averageImportCosts))
                                .build();
        }

        private BigDecimal resolveAverageImportCost(ProductVariantEntity variant, InventoryEntity inventory) {
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

                if (inventory != null && inventory.getQuantityOnHand() != null && inventory.getQuantityOnHand() > 0) {
                        return BigDecimal.ZERO;
                }

                return BigDecimal.ZERO;
        }

        private BigDecimal resolveAverageImportCost(ProductVariantEntity variant, InventoryEntity inventory, Map<UUID, BigDecimal> averageImportCosts) {
                BigDecimal averageImportCost = averageImportCosts.get(variant.getId());
                if (averageImportCost != null) {
                        return averageImportCost;
                }

                return resolveAverageImportCost(variant, inventory);
        }
}
