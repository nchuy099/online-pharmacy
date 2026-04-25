package com.nchuy099.SmartPharma.flashsale.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.flashsale.dto.request.ClaimFlashSaleRequest;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleCampaignResponse;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleClaimResponse;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleItemResponse;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/flash-sales")
@RequiredArgsConstructor
public class FlashSaleController {

    private final FlashSaleService flashSaleService;

    @GetMapping("/active")
    public List<FlashSaleItemResponse> getActiveFlashSales() {
        return flashSaleService.getActiveItems();
    }

    @GetMapping("/items/{itemId}")
    public FlashSaleItemResponse getFlashSaleItem(@PathVariable UUID itemId) {
        return flashSaleService.getItem(itemId);
    }

    @PostMapping("/items/{itemId}/claim")
    public FlashSaleClaimResponse claimFlashSale(@PathVariable UUID itemId, @RequestBody @Valid ClaimFlashSaleRequest request) {
        return flashSaleService.claim(itemId, request);
    }

    @GetMapping("/variants")
    public List<FlashSaleItemResponse> getActiveFlashSalesByVariants(@RequestParam(name = "variantId", required = false) List<UUID> variantIds) {
        return flashSaleService.getActiveItemsByVariantIds(variantIds);
    }

    @GetMapping("/events")
    public List<FlashSaleCampaignResponse> getBigEvents() {
        return flashSaleService.getBigEventCampaigns();
    }

    @GetMapping("/campaigns")
    public List<FlashSaleCampaignResponse> getCampaigns() {
        return flashSaleService.getCustomerCampaigns();
    }

    @GetMapping("/events/{campaignCode}")
    public FlashSaleCampaignResponse getBigEvent(@PathVariable String campaignCode) {
        return flashSaleService.getBigEventCampaignByCode(campaignCode);
    }
}
