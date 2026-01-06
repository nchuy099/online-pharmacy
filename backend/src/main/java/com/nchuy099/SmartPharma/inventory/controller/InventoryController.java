package com.nchuy099.SmartPharma.inventory.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.nchuy099.SmartPharma.inventory.dto.request.ImportStockRequest;
import com.nchuy099.SmartPharma.inventory.dto.response.InventoryPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionPageResponse;
import com.nchuy099.SmartPharma.inventory.dto.response.TransactionResponse;
import com.nchuy099.SmartPharma.inventory.service.InventoryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping({"/admin/inventory", "/admin/inventories"})
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'SUPER_ADMIN')")
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/{variantId}/import")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).IMPORT_INVENTORY)")
    public void importStock(
            @PathVariable(name = "variantId") String variantId,
            @RequestBody ImportStockRequest req) {
        log.info("Import stock request received for variant: {}", variantId);
        inventoryService.importStock(variantId, req);
    }

    @GetMapping("/transactions/{id}/details")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_INVENTORY)")
    public TransactionResponse getTransactionDetails(
            @PathVariable(name = "id") String id) {
        log.info("Get transaction details request received");
        return inventoryService.getTransactionDetails(id);
    }

    @GetMapping("/{variantId}/transactions/list")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_INVENTORY)")
    public TransactionPageResponse getTransactionList(
            @PathVariable(name = "variantId") String variantId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Get transaction list request received for variant: {}", variantId);
        return inventoryService.getTransactionList(variantId, page, size);
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_INVENTORY)")
    public InventoryPageResponse getInventoryList(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search) {
        log.info("Get inventory list request received with search: {}", search);
        return inventoryService.getInventoryList(page, size, search);
    }
}
