package com.nchuy099.SmartPharma.order.application.checkout;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleReservationView;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.inventory.service.InventoryDomainService;
import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.service.OrderAmountCalculator;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class FlashSaleCheckoutStrategy implements CheckoutStrategy {

    private final InventoryDomainService inventoryDomainService;
    private final FlashSaleService flashSaleService;
    private final OrderAmountCalculator orderAmountCalculator;

    @Override
    public boolean supports(OrderMode mode, boolean flashSale) {
        return mode == OrderMode.BUY_NOW && flashSale;
    }

    @Override
    public CheckoutContext prepareForPreview(OrderPreviewRequest request, UUID userId) {
        validate(request.getBuyNowItem() != null ? request.getBuyNowItem().getVariantId() : null,
                request.getBuyNowItem() != null ? request.getBuyNowItem().getQuantity() : null,
                request.getFlashSaleReservationId());
        var inventory = inventoryDomainService.getInventory(request.getBuyNowItem().getVariantId());
        FlashSaleReservationView reservation = flashSaleService.resolveReservationForCheckout(
                request.getFlashSaleReservationId(), userId);
        validateReservation(request.getBuyNowItem().getVariantId(), request.getBuyNowItem().getQuantity(), reservation);
        return CheckoutContext.builder()
                .mode(OrderMode.BUY_NOW)
                .variant(inventory.getVariant())
                .quantity(request.getBuyNowItem().getQuantity())
                .amount(orderAmountCalculator.calculateAmount(inventory.getVariant(), request.getBuyNowItem().getQuantity(),
                        reservation.getFlashPrice()))
                .unitPriceOverride(reservation.getFlashPrice())
                .flashSaleReservation(reservation)
                .flashSaleReservationId(request.getFlashSaleReservationId())
                .build();
    }

    @Override
    public CheckoutContext prepareForCreate(OrderCreateRequest request, UUID userId) {
        validate(request.getBuyNowItem() != null ? request.getBuyNowItem().getVariantId() : null,
                request.getBuyNowItem() != null ? request.getBuyNowItem().getQuantity() : null,
                request.getFlashSaleReservationId());
        var inventory = inventoryDomainService.getInventory(request.getBuyNowItem().getVariantId());
        FlashSaleReservationView reservation = flashSaleService.resolveReservationForCheckout(
                request.getFlashSaleReservationId(), userId);
        validateReservation(request.getBuyNowItem().getVariantId(), request.getBuyNowItem().getQuantity(), reservation);
        return CheckoutContext.builder()
                .mode(OrderMode.BUY_NOW)
                .variant(inventory.getVariant())
                .quantity(request.getBuyNowItem().getQuantity())
                .amount(orderAmountCalculator.calculateAmount(inventory.getVariant(), request.getBuyNowItem().getQuantity(),
                        reservation.getFlashPrice()))
                .unitPriceOverride(reservation.getFlashPrice())
                .flashSaleReservation(reservation)
                .flashSaleReservationId(request.getFlashSaleReservationId())
                .build();
    }

    private void validate(String variantId, Integer quantity, UUID reservationId) {
        if (!StringUtils.hasText(variantId) || quantity == null || quantity <= 0 || reservationId == null) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Flash sale checkout requires reservation, valid variantId and quantity > 0");
        }
    }

    private void validateReservation(String variantId, Integer quantity, FlashSaleReservationView reservation) {
        if (!reservation.getVariantId().toString().equals(variantId)) {
            throw new AppException(ErrorCode.CONFLICT, "Flash sale reservation does not match selected item");
        }
        if (!reservation.getQuantity().equals(quantity)) {
            throw new AppException(ErrorCode.CONFLICT, "Flash sale reservation quantity mismatch");
        }
    }
}
