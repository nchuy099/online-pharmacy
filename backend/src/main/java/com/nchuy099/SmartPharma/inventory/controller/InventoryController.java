package com.nchuy099.SmartPharma.inventory.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.inventory.dto.request.ImportStockRequest;
import com.nchuy099.SmartPharma.inventory.dto.response.ImportStockResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryLotPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionResponse;
import com.nchuy099.SmartPharma.inventory.entity.InventoryLotEntity;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.service.InventoryCommandService;
import com.nchuy099.SmartPharma.inventory.service.InventoryQueryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping({"/admin/inventory", "/admin/inventories"})
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'SUPER_ADMIN')")
public class InventoryController {

    private final InventoryQueryService inventoryQueryService;
    private final InventoryCommandService inventoryCommandService;
    private final SecurityUtils securityUtils;

    @PostMapping("/{variantId}/import")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).IMPORT_INVENTORY)")
    public ImportStockResponse importStock(
            @PathVariable(name = "variantId") String variantId,
            @RequestBody ImportStockRequest req) {
        log.info("Import stock request received for variant: {}", variantId);
        java.util.UUID variantUuid = java.util.UUID.fromString(variantId);
        InventoryLotEntity lot = inventoryCommandService.importLot(
                variantUuid,
                req,
                securityUtils.getCurrentUserId());
        InventorySummaryEntity summary = inventoryQueryService.getInventorySummary(variantId);
        return inventoryQueryService.getImportStockResponse(summary, lot);
    }

    @GetMapping("/{variantId}/lots")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_INVENTORY)")
    public InventoryLotPageResponse getInventoryLots(
            @PathVariable(name = "variantId") String variantId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "status", required = false) String status) {
        log.info("Get inventory lot list request received for variant: {}", variantId);
        return inventoryQueryService.getInventoryLots(variantId, page, size, search, status);
    }

    @GetMapping("/transactions/{id}/details")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_INVENTORY)")
    public TransactionResponse getTransactionDetails(
            @PathVariable(name = "id") String id) {
        log.info("Get transaction details request received");
        return inventoryQueryService.getTransactionDetails(id);
    }

    @GetMapping("/{variantId}/transactions/list")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_INVENTORY)")
    public TransactionPageResponse getTransactionList(
            @PathVariable(name = "variantId") String variantId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Get transaction list request received for variant: {}", variantId);
        return inventoryQueryService.getTransactionList(variantId, page, size);
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_INVENTORY)")
    public InventoryPageResponse getInventoryList(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search) {
        log.info("Get inventory list request received with search: {}", search);
        return inventoryQueryService.getInventoryList(page, size, search);
    }
}
