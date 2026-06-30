package com.nchuy099.SmartPharma.order.application.checkout;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.cart.service.CartService;
import com.nchuy099.SmartPharma.inventory.service.InventoryQueryService;
import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.service.OrderAmountCalculator;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CartCheckoutStrategy implements CheckoutStrategy {

    private final CartService cartService;
    private final InventoryQueryService inventoryQueryService;
    private final OrderAmountCalculator orderAmountCalculator;

    @Override
    public boolean supports(OrderMode mode, boolean flashSale) {
        return mode == OrderMode.CART && !flashSale;
    }

    @Override
    public CheckoutContext prepareForPreview(OrderPreviewRequest request, UUID userId) {
        var cartItems = cartService.getSelectedCartItems(userId);
        cartItems.forEach(item -> inventoryQueryService.validateAvailableStock(item.getVariant().getId(), item.getQuantity()));
        return CheckoutContext.builder()
                .mode(OrderMode.CART)
                .cartItems(cartItems)
                .amount(orderAmountCalculator.calculateCartAmount(cartItems))
                .build();
    }

    @Override
    public CheckoutContext prepareForCreate(OrderCreateRequest request, UUID userId) {
        var cartItems = cartService.getSelectedCartItems(userId);
        cartItems.forEach(item -> inventoryQueryService.validateAvailableStock(item.getVariant().getId(), item.getQuantity()));
        return CheckoutContext.builder()
                .mode(OrderMode.CART)
                .cartItems(cartItems)
                .amount(orderAmountCalculator.calculateCartAmount(cartItems))
                .build();
    }
}
