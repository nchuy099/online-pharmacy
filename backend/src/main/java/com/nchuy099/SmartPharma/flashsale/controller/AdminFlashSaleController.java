package com.nchuy099.SmartPharma.flashsale.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.flashsale.dto.request.CreateFlashSaleCampaignRequest;
import com.nchuy099.SmartPharma.flashsale.dto.request.GenerateRandomFlashSaleCampaignRequest;
import com.nchuy099.SmartPharma.flashsale.dto.request.UpdateFlashSaleCampaignRequest;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleCampaignResponse;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleAutoGenerationService;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.user.enums.RbacPermissions;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/admin/flash-sales")
@RequiredArgsConstructor
public class AdminFlashSaleController {

    private final FlashSaleService flashSaleService;
    private final FlashSaleAutoGenerationService flashSaleAutoGenerationService;

    @GetMapping
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public Page<FlashSaleCampaignResponse> list(@RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        return flashSaleService.listCampaigns(page, size);
    }

    @GetMapping("/{campaignId}")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public FlashSaleCampaignResponse get(@PathVariable UUID campaignId) {
        return flashSaleService.getCampaign(campaignId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public FlashSaleCampaignResponse create(@RequestBody @Valid CreateFlashSaleCampaignRequest request) {
        return flashSaleService.createCampaign(request);
    }

    @PostMapping("/random-draft")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public FlashSaleCampaignResponse randomDraft(@RequestBody @Valid GenerateRandomFlashSaleCampaignRequest request) {
        return flashSaleAutoGenerationService.generateRandomDraftCampaign(request);
    }

    @PutMapping("/{campaignId}")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public FlashSaleCampaignResponse update(@PathVariable UUID campaignId, @RequestBody UpdateFlashSaleCampaignRequest request) {
        return flashSaleService.updateCampaign(campaignId, request);
    }

    @PostMapping("/{campaignId}/items")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public FlashSaleCampaignResponse addItem(@PathVariable UUID campaignId, @RequestBody @Valid CreateFlashSaleCampaignRequest.ItemRequest request) {
        return flashSaleService.addCampaignItem(campaignId, request);
    }

    @PutMapping("/{campaignId}/items/{itemId}")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public FlashSaleCampaignResponse updateItem(@PathVariable UUID campaignId, @PathVariable UUID itemId,
            @RequestBody @Valid CreateFlashSaleCampaignRequest.ItemRequest request) {
        return flashSaleService.updateCampaignItem(campaignId, itemId, request);
    }

    @DeleteMapping("/{campaignId}/items/{itemId}")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public FlashSaleCampaignResponse deleteItem(@PathVariable UUID campaignId, @PathVariable UUID itemId) {
        return flashSaleService.removeCampaignItem(campaignId, itemId);
    }

    @PostMapping("/{campaignId}/publish")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public FlashSaleCampaignResponse publish(@PathVariable UUID campaignId) {
        return flashSaleService.publishCampaign(campaignId);
    }

    @PostMapping("/{campaignId}/cancel")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_FLASH_SALE)")
    public FlashSaleCampaignResponse cancel(@PathVariable UUID campaignId) {
        return flashSaleService.cancelCampaign(campaignId);
    }
}
