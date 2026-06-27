package com.nchuy099.SmartPharma.order.application.checkout;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.inventory.service.InventoryDomainService;
import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.service.OrderAmountCalculator;
import com.nchuy099.SmartPharma.order.dto.request.BuyNowItemDto;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

class BuyNowCheckoutStrategyTest {

    private InventoryDomainService inventoryDomainService;
    private OrderAmountCalculator orderAmountCalculator;
    private BuyNowCheckoutStrategy strategy;

    @BeforeEach
    void setUp() {
        inventoryDomainService = mock(InventoryDomainService.class);
        orderAmountCalculator = mock(OrderAmountCalculator.class);
        strategy = new BuyNowCheckoutStrategy(inventoryDomainService, orderAmountCalculator);
    }

    @Test
    void supportsOnlyBuyNowWithoutFlashSale() {
        assertEquals(true, strategy.supports(OrderMode.BUY_NOW, false));
        assertEquals(false, strategy.supports(OrderMode.CART, false));
        assertEquals(false, strategy.supports(OrderMode.BUY_NOW, true));
    }

    @Test
    void prepareForPreviewShouldValidateAndLoadInventory() {
        UUID variantId = UUID.randomUUID();
        OrderPreviewRequest request = buyNowPreviewRequest(variantId, 2);
        ProductVariantEntity variant = variant();
        InventoryEntity inventory = InventoryEntity.builder().variant(variant).build();

        when(inventoryDomainService.getInventory(variantId.toString())).thenReturn(inventory);
        when(orderAmountCalculator.calculateAmount(variant, 2)).thenReturn(new BigDecimal("240000"));

        CheckoutContext context = strategy.prepareForPreview(request, UUID.randomUUID());

        assertEquals(OrderMode.BUY_NOW, context.mode());
        assertEquals(variant, context.variant());
        assertEquals(2, context.quantity());
        assertEquals(new BigDecimal("240000"), context.amount());
    }

    @Test
    void prepareForCreateShouldReserveInventory() {
        UUID variantId = UUID.randomUUID();
        OrderCreateRequest request = buyNowCreateRequest(variantId, 2);
        ProductVariantEntity variant = variant();
        InventoryEntity inventory = InventoryEntity.builder().variant(variant).build();

        when(inventoryDomainService.getInventory(variantId.toString())).thenReturn(inventory);
        when(orderAmountCalculator.calculateAmount(variant, 2)).thenReturn(new BigDecimal("240000"));

        CheckoutContext context = strategy.prepareForCreate(request, UUID.randomUUID());

        assertEquals(OrderMode.BUY_NOW, context.mode());
        assertEquals(variant, context.variant());
        assertEquals(2, context.quantity());
        assertEquals(new BigDecimal("240000"), context.amount());
    }

    @Test
    void prepareShouldRejectInvalidQuantity() {
        OrderPreviewRequest request = new OrderPreviewRequest();
        BuyNowItemDto item = new BuyNowItemDto();
        item.setVariantId("");
        item.setQuantity(0);
        request.setBuyNowItem(item);

        assertThrows(AppException.class, () -> strategy.prepareForPreview(request, UUID.randomUUID()));
    }

    private OrderPreviewRequest buyNowPreviewRequest(UUID variantId, int qty) {
        OrderPreviewRequest request = new OrderPreviewRequest();
        request.setMode("BUY_NOW");
        BuyNowItemDto item = new BuyNowItemDto();
        item.setVariantId(variantId.toString());
        item.setQuantity(qty);
        request.setBuyNowItem(item);
        return request;
    }

    private OrderCreateRequest buyNowCreateRequest(UUID variantId, int qty) {
        OrderCreateRequest request = new OrderCreateRequest();
        request.setMode("BUY_NOW");
        request.setPaymentMethod("VNPAY");
        request.setCheckoutQuoteId(UUID.randomUUID());
        BuyNowItemDto item = new BuyNowItemDto();
        item.setVariantId(variantId.toString());
        item.setQuantity(qty);
        request.setBuyNowItem(item);
        return request;
    }

    private ProductVariantEntity variant() {
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
        return variant;
    }
}
