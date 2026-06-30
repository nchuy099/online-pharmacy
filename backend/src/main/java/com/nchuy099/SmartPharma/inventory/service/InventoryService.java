package com.nchuy099.SmartPharma.inventory.service;

import com.nchuy099.SmartPharma.inventory.dto.request.ImportStockRequest;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryLotPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionResponse;
import com.nchuy099.SmartPharma.inventory.repository.InventoryLotRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventorySummaryRepository;
import com.nchuy099.SmartPharma.inventory.repository.InventoryTransactionRepository;

@Deprecated
public class InventoryService {

    private final InventoryQueryService inventoryQueryService;

    public InventoryService(
            InventoryRepository inventoryRepository,
            InventorySummaryRepository inventorySummaryRepository,
            InventoryLotRepository inventoryLotRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            InventoryDomainService inventoryDomainService) {
        this.inventoryQueryService = new InventoryQueryService(
                inventorySummaryRepository,
                inventoryLotRepository,
                inventoryTransactionRepository);
    }

    public void importStock(String variantId, ImportStockRequest req) {
        throw new UnsupportedOperationException("Legacy inventory import service is no longer supported");
    }

    public TransactionResponse getTransactionDetails(String transactionId) {
        return inventoryQueryService.getTransactionDetails(transactionId);
    }

    public TransactionPageResponse getTransactionList(String variantId, int page, int size) {
        return inventoryQueryService.getTransactionList(variantId, page, size);
    }

    public InventoryLotPageResponse getInventoryLots(String variantId, int page, int size, String search, String status) {
        return inventoryQueryService.getInventoryLots(variantId, page, size, search, status);
    }

    public InventoryPageResponse getInventoryList(int page, int size, String search) {
        return inventoryQueryService.getInventoryList(page, size, search);
    }
}
