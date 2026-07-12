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
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleReservationView;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.inventory.entity.InventorySummaryEntity;
import com.nchuy099.SmartPharma.inventory.service.InventoryQueryService;
import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.service.OrderAmountCalculator;
import com.nchuy099.SmartPharma.order.dto.request.BuyNowItemDto;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;

class FlashSaleCheckoutStrategyTest {

    private InventoryQueryService inventoryQueryService;
    private FlashSaleService flashSaleService;
    private OrderAmountCalculator orderAmountCalculator;
    private FlashSaleCheckoutStrategy strategy;

    @BeforeEach
    void setUp() {
        inventoryQueryService = mock(InventoryQueryService.class);
        flashSaleService = mock(FlashSaleService.class);
        orderAmountCalculator = mock(OrderAmountCalculator.class);
        strategy = new FlashSaleCheckoutStrategy(inventoryQueryService, flashSaleService, orderAmountCalculator);
    }

    @Test
    void supportsOnlyBuyNowWithFlashSale() {
        assertEquals(true, strategy.supports(OrderMode.BUY_NOW, true));
        assertEquals(false, strategy.supports(OrderMode.BUY_NOW, false));
        assertEquals(false, strategy.supports(OrderMode.CART, true));
    }

    @Test
    void prepareForPreviewShouldUseFlashPrice() {
        UUID variantId = UUID.randomUUID();
        UUID reservationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        OrderPreviewRequest request = request(variantId, 2, reservationId);
        ProductVariantEntity variant = variant();
        InventorySummaryEntity inventory = summary(variant);
        FlashSaleReservationView reservation = FlashSaleReservationView.builder()
                .reservationId(reservationId)
                .variantId(variantId)
                .quantity(2)
                .flashPrice(new BigDecimal("90000"))
                .build();

        when(inventoryQueryService.getInventorySummary(variantId.toString())).thenReturn(inventory);
        when(flashSaleService.resolveReservationForCheckout(reservationId, userId)).thenReturn(reservation);
        when(orderAmountCalculator.calculateAmount(variant, 2, new BigDecimal("90000"))).thenReturn(new BigDecimal("180000"));

        CheckoutContext context = strategy.prepareForPreview(request, userId);

        assertEquals(OrderMode.BUY_NOW, context.mode());
        assertEquals(variant, context.variant());
        assertEquals(new BigDecimal("90000"), context.unitPriceOverride());
        assertEquals(new BigDecimal("180000"), context.amount());
    }

    @Test
    void prepareForCreateShouldRejectMismatchedReservation() {
        UUID variantId = UUID.randomUUID();
        UUID reservationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        OrderCreateRequest request = requestCreate(variantId, 2, reservationId);
        ProductVariantEntity variant = variant();
        InventorySummaryEntity inventory = summary(variant);
        FlashSaleReservationView reservation = FlashSaleReservationView.builder()
                .reservationId(reservationId)
                .variantId(UUID.randomUUID())
                .quantity(2)
                .flashPrice(new BigDecimal("90000"))
                .build();

        when(inventoryQueryService.getInventorySummary(variantId.toString())).thenReturn(inventory);
        when(flashSaleService.resolveReservationForCheckout(reservationId, userId)).thenReturn(reservation);

        assertThrows(AppException.class, () -> strategy.prepareForCreate(request, userId));
    }

    private OrderPreviewRequest request(UUID variantId, int qty, UUID reservationId) {
        OrderPreviewRequest request = new OrderPreviewRequest();
        request.setMode("BUY_NOW");
        request.setFlashSaleReservationId(reservationId);
        BuyNowItemDto item = new BuyNowItemDto();
        item.setVariantId(variantId.toString());
        item.setQuantity(qty);
        request.setBuyNowItem(item);
        return request;
    }

    private OrderCreateRequest requestCreate(UUID variantId, int qty, UUID reservationId) {
        OrderCreateRequest request = new OrderCreateRequest();
        request.setMode("BUY_NOW");
        request.setPaymentMethod("BANK_TRANSFER");
        request.setFlashSaleReservationId(reservationId);
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

    private InventorySummaryEntity summary(ProductVariantEntity variant) {
        return InventorySummaryEntity.builder()
                .variant(variant)
                .quantityOnHand(10)
                .quantityReserved(0)
                .build();
    }
}
