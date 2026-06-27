package com.nchuy099.SmartPharma.order.application.preview;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.cart.service.CartService;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.event.service.EventService;
import com.nchuy099.SmartPharma.order.application.checkout.CheckoutStrategy;
import com.nchuy099.SmartPharma.order.application.checkout.CheckoutStrategyResolver;
import com.nchuy099.SmartPharma.order.application.checkout.quote.CheckoutQuoteEntity;
import com.nchuy099.SmartPharma.order.application.checkout.quote.CheckoutQuoteService;
import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.factory.OrderFactory;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.request.BuyNowItemDto;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;
import com.nchuy099.SmartPharma.order.infrastructure.shipping.ShippingProvider;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.user.entity.AddressEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.AddressRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class OrderPreviewUseCaseTest {

    private SecurityUtils securityUtils;
    private CartService cartService;
    private EventService eventService;
    private CheckoutStrategyResolver checkoutStrategyResolver;
    private OrderMapper orderMapper;
    private AddressRepository addressRepository;
    private CheckoutQuoteService checkoutQuoteService;
    private ShippingProvider shippingProvider;
    private OrderFactory orderFactory;
    private UserRepository userRepository;
    private OrderPreviewUseCase useCase;

    @BeforeEach
    void setUp() {
        securityUtils = mock(SecurityUtils.class);
        cartService = mock(CartService.class);
        eventService = mock(EventService.class);
        checkoutStrategyResolver = mock(CheckoutStrategyResolver.class);
        orderMapper = mock(OrderMapper.class);
        addressRepository = mock(AddressRepository.class);
        checkoutQuoteService = mock(CheckoutQuoteService.class);
        shippingProvider = mock(ShippingProvider.class);
        orderFactory = mock(OrderFactory.class);
        userRepository = mock(UserRepository.class);

        useCase = new OrderPreviewUseCase(securityUtils, cartService, eventService, checkoutStrategyResolver,
                orderMapper, addressRepository, checkoutQuoteService, shippingProvider, orderFactory, userRepository);
    }

    @Test
    void previewShouldBuildShippingQuoteForBuyNow() {
        UUID userId = UUID.randomUUID();
        UUID addressId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        UUID quoteId = UUID.randomUUID();

        ProductVariantEntity variant = variant();
        OrderPreviewRequest request = new OrderPreviewRequest();
        request.setMode("BUY_NOW");
        request.setAddressId(addressId);
        request.setServiceId(2);
        BuyNowItemDto item = new BuyNowItemDto();
        item.setVariantId(variantId.toString());
        item.setQuantity(2);
        request.setBuyNowItem(item);

        CheckoutStrategy strategy = mock(CheckoutStrategy.class);
        CheckoutContext context = CheckoutContext.builder()
                .mode(OrderMode.BUY_NOW)
                .variant(variant)
                .quantity(2)
                .amount(new BigDecimal("240000"))
                .build();
        OrderEntity tempOrder = OrderEntity.builder().build();
        AddressEntity address = AddressEntity.builder()
                .ghnDistrictId(2)
                .ghnWardCode("W1")
                .build();
        address.setId(addressId);
        CheckoutQuoteEntity savedQuote = CheckoutQuoteEntity.builder()
                .expiresAt(Instant.now().plusSeconds(300))
                .build();
        savedQuote.setId(quoteId);

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(checkoutStrategyResolver.resolve(OrderMode.BUY_NOW, null)).thenReturn(strategy);
        when(strategy.prepareForPreview(request, userId)).thenReturn(context);
        when(orderMapper.toBuyNowPreview(variant, 2, new BigDecimal("240000"))).thenReturn(
                PreviewResponse.builder()
                        .itemTotalAmount(new BigDecimal("240000"))
                        .finalAmount(new BigDecimal("240000"))
                        .build());
        when(addressRepository.findByIdAndUserId(addressId, userId)).thenReturn(Optional.of(address));
        when(orderFactory.buildBuyNowOrder(null, null, variant, 2, com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod.VNPAY, null))
                .thenReturn(tempOrder);
        when(shippingProvider.getAvailableShippingMethods(tempOrder, 2, "W1")).thenReturn(List.of(
                PreviewResponse.ShippingMethodDto.builder()
                        .serviceId(2)
                        .fee(new BigDecimal("15000"))
                        .expectedDeliveryTime(Instant.now().plusSeconds(86400).getEpochSecond())
                        .build()));
        when(checkoutQuoteService.createQuote(org.mockito.ArgumentMatchers.any())).thenReturn(savedQuote);

        PreviewResponse response = useCase.preview(request);

        assertEquals(new BigDecimal("15000"), response.getShippingFee());
        assertEquals(new BigDecimal("255000"), response.getFinalAmount());
        assertEquals(quoteId, response.getCheckoutQuoteId());
        verify(eventService).createEvent(org.mockito.ArgumentMatchers.any());
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
