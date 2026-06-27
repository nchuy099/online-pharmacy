package com.nchuy099.SmartPharma.order.application.checkout;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.inventory.service.InventoryDomainService;
import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.service.OrderAmountCalculator;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

class CartCheckoutStrategyTest {

    private CartService cartService;
    private InventoryDomainService inventoryDomainService;
    private OrderAmountCalculator orderAmountCalculator;
    private CartCheckoutStrategy strategy;

    @BeforeEach
    void setUp() {
        cartService = mock(CartService.class);
        inventoryDomainService = mock(InventoryDomainService.class);
        orderAmountCalculator = mock(OrderAmountCalculator.class);
        strategy = new CartCheckoutStrategy(cartService, inventoryDomainService, orderAmountCalculator);
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

        CheckoutContext context = strategy.prepareForPreview(new com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest(), userId);

        assertEquals(OrderMode.CART, context.mode());
        assertEquals(cartItems, context.cartItems());
        assertEquals(new BigDecimal("240000"), context.amount());
        verify(inventoryDomainService).ensureCartAvailable(cartItems);
    }

    @Test
    void prepareForCreateShouldReserveCartItems() {
        UUID userId = UUID.randomUUID();
        CartItemEntity cartItem = cartItem();
        List<CartItemEntity> cartItems = List.of(cartItem);

        when(cartService.getSelectedCartItems(userId)).thenReturn(cartItems);
        when(orderAmountCalculator.calculateCartAmount(cartItems)).thenReturn(new BigDecimal("240000"));

        CheckoutContext context = strategy.prepareForCreate(new com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest(), userId);

        assertEquals(OrderMode.CART, context.mode());
        assertEquals(cartItems, context.cartItems());
        assertEquals(new BigDecimal("240000"), context.amount());
        verify(inventoryDomainService).reserveCart(cartItems);
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
