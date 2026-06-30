package com.nchuy099.SmartPharma.order.application.checkout;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.service.InventoryQueryService;
import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.service.OrderAmountCalculator;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BuyNowCheckoutStrategy implements CheckoutStrategy {

    private final InventoryQueryService inventoryQueryService;
    private final OrderAmountCalculator orderAmountCalculator;

    @Override
    public boolean supports(OrderMode mode, boolean flashSale) {
        return mode == OrderMode.BUY_NOW && !flashSale;
    }

    @Override
    public CheckoutContext prepareForPreview(OrderPreviewRequest request, UUID userId) {
        validate(request.getBuyNowItem() != null ? request.getBuyNowItem().getVariantId() : null,
                request.getBuyNowItem() != null ? request.getBuyNowItem().getQuantity() : null);
        var inventory = inventoryQueryService.getInventorySummary(request.getBuyNowItem().getVariantId());
        inventoryQueryService.validateAvailableStock(inventory.getVariant().getId(), request.getBuyNowItem().getQuantity());
        return CheckoutContext.builder()
                .mode(OrderMode.BUY_NOW)
                .variant(inventory.getVariant())
                .quantity(request.getBuyNowItem().getQuantity())
                .amount(orderAmountCalculator.calculateAmount(inventory.getVariant(), request.getBuyNowItem().getQuantity()))
                .build();
    }

    @Override
    public CheckoutContext prepareForCreate(OrderCreateRequest request, UUID userId) {
        validate(request.getBuyNowItem() != null ? request.getBuyNowItem().getVariantId() : null,
                request.getBuyNowItem() != null ? request.getBuyNowItem().getQuantity() : null);
        var inventory = inventoryQueryService.getInventorySummary(request.getBuyNowItem().getVariantId());
        inventoryQueryService.validateAvailableStock(inventory.getVariant().getId(), request.getBuyNowItem().getQuantity());
        return CheckoutContext.builder()
                .mode(OrderMode.BUY_NOW)
                .variant(inventory.getVariant())
                .quantity(request.getBuyNowItem().getQuantity())
                .amount(orderAmountCalculator.calculateAmount(inventory.getVariant(), request.getBuyNowItem().getQuantity()))
                .build();
    }

    private void validate(String variantId, Integer quantity) {
        if (!StringUtils.hasText(variantId) || quantity == null || quantity <= 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "BUY_NOW requires valid buyNowItem.variantId and quantity > 0");
        }
    }
}
