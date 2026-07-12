package com.nchuy099.SmartPharma.order.application.checkout;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.cart.service.CartService;
import com.nchuy099.SmartPharma.inventory.service.InventoryQueryService;
import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.service.OrderAmountCalculator;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

class CartCheckoutStrategyTest {

    private CartService cartService;
    private InventoryQueryService inventoryQueryService;
    private OrderAmountCalculator orderAmountCalculator;
    private CartCheckoutStrategy strategy;

    @BeforeEach
    void setUp() {
        cartService = mock(CartService.class);
        inventoryQueryService = mock(InventoryQueryService.class);
        orderAmountCalculator = mock(OrderAmountCalculator.class);
        strategy = new CartCheckoutStrategy(cartService, inventoryQueryService, orderAmountCalculator);
    }

    @Test
    void supportsOnlyCartWithoutFlashSale() {
        assertEquals(true, strategy.supports(OrderMode.CART, false));
        assertEquals(false, strategy.supports(OrderMode.BUY_NOW, false));
        assertEquals(false, strategy.supports(OrderMode.CART, true));
    }

    @Test
    void prepareForPreviewShouldLoadSelectedCartItemsAndCalculateAmount() {
        UUID userId = UUID.randomUUID();
        CartItemEntity cartItem = cartItem();
        List<CartItemEntity> cartItems = List.of(cartItem);

        when(cartService.getSelectedCartItems(userId)).thenReturn(cartItems);
        when(orderAmountCalculator.calculateCartAmount(cartItems)).thenReturn(new BigDecimal("240000"));
        doNothing().when(inventoryQueryService).validateAvailableStock(cartItem.getVariant().getId(), 2);

        CheckoutContext context = strategy.prepareForPreview(new com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest(), userId);

        assertEquals(OrderMode.CART, context.mode());
        assertEquals(cartItems, context.cartItems());
        assertEquals(new BigDecimal("240000"), context.amount());
        verify(inventoryQueryService).validateAvailableStock(cartItem.getVariant().getId(), 2);
    }

    @Test
    void prepareForCreateShouldValidateCartItems() {
        UUID userId = UUID.randomUUID();
        CartItemEntity cartItem = cartItem();
        List<CartItemEntity> cartItems = List.of(cartItem);

        when(cartService.getSelectedCartItems(userId)).thenReturn(cartItems);
        when(orderAmountCalculator.calculateCartAmount(cartItems)).thenReturn(new BigDecimal("240000"));
        doNothing().when(inventoryQueryService).validateAvailableStock(cartItem.getVariant().getId(), 2);

        CheckoutContext context = strategy.prepareForCreate(new com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest(), userId);

        assertEquals(OrderMode.CART, context.mode());
        assertEquals(cartItems, context.cartItems());
        assertEquals(new BigDecimal("240000"), context.amount());
        verify(inventoryQueryService).validateAvailableStock(cartItem.getVariant().getId(), 2);
    }

    private CartItemEntity cartItem() {
        ProductEntity product = ProductEntity.builder()
                .name("Paracetamol")
                .webName("Paracetamol")
                .slug("paracetamol")
                .build();
        product.setId(UUID.randomUUID());

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .product(product)
                .sku("PARA-500")
                .unitType("box")
                .salePrice(new BigDecimal("120000"))
                .build();
        variant.setId(UUID.randomUUID());

        return CartItemEntity.builder()
                .variant(variant)
                .quantity(2)
                .build();
    }
}
