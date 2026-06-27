package com.nchuy099.SmartPharma.order.application.create;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
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

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.cart.service.CartService;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleReservationView;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.order.application.checkout.CheckoutStrategy;
import com.nchuy099.SmartPharma.order.application.checkout.CheckoutStrategyResolver;
import com.nchuy099.SmartPharma.order.application.checkout.quote.CheckoutQuoteEntity;
import com.nchuy099.SmartPharma.order.application.checkout.quote.CheckoutQuoteService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.factory.OrderFactory;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.request.BuyNowItemDto;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderEventPublisher;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.user.entity.AddressEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.AddressRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class CreateOrderUseCaseTest {

    private SecurityUtils securityUtils;
    private UserRepository userRepository;
    private AddressRepository addressRepository;
    private CheckoutQuoteService checkoutQuoteService;
    private CheckoutStrategyResolver checkoutStrategyResolver;
    private OrderFactory orderFactory;
    private OrderRepository orderRepository;
    private OrderMapper orderMapper;
    private FlashSaleService flashSaleService;
    private CartService cartService;
    private OrderEventPublisher orderEventPublisher;
    private CreateOrderUseCase useCase;

    @BeforeEach
    void setUp() {
        securityUtils = mock(SecurityUtils.class);
        userRepository = mock(UserRepository.class);
        addressRepository = mock(AddressRepository.class);
        checkoutQuoteService = mock(CheckoutQuoteService.class);
        checkoutStrategyResolver = mock(CheckoutStrategyResolver.class);
        orderFactory = mock(OrderFactory.class);
        orderRepository = mock(OrderRepository.class);
        orderMapper = mock(OrderMapper.class);
        flashSaleService = mock(FlashSaleService.class);
        cartService = mock(CartService.class);
        orderEventPublisher = mock(OrderEventPublisher.class);

        useCase = new CreateOrderUseCase(securityUtils, userRepository, addressRepository, checkoutQuoteService,
                checkoutStrategyResolver, orderFactory, orderRepository, orderMapper, flashSaleService, cartService,
                orderEventPublisher);
    }

    @Test
    void createShouldConfirmFlashSaleReservationAndPersistOrder() {
        UUID userId = UUID.randomUUID();
        UUID addressId = UUID.randomUUID();
        UUID quoteId = UUID.randomUUID();
        UUID reservationId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        ProductVariantEntity variant = variant();
        CartItemEntity cartItem = CartItemEntity.builder().variant(variant).quantity(2).build();
        List<CartItemEntity> cartItems = List.of(cartItem);
        UserEntity user = new UserEntity();
        user.setId(userId);
        AddressEntity address = AddressEntity.builder()
                .ghnDistrictId(2)
                .ghnWardCode("W1")
                .build();
        address.setId(addressId);
        CheckoutQuoteEntity quote = CheckoutQuoteEntity.builder()
                .addressId(addressId)
                .shippingFee(new BigDecimal("15000"))
                .shippingServiceId(2)
                .expectedDeliveryTime(Instant.now().plusSeconds(86400).getEpochSecond())
                .build();
        quote.setId(quoteId);
        FlashSaleReservationView reservation = FlashSaleReservationView.builder()
                .reservationId(reservationId)
                .variantId(variantId)
                .quantity(2)
                .flashPrice(new BigDecimal("90000"))
                .userId(userId)
                .build();
        CheckoutContext context = CheckoutContext.builder()
                .mode(OrderMode.BUY_NOW)
                .variant(variant)
                .quantity(2)
                .unitPriceOverride(new BigDecimal("90000"))
                .flashSaleReservation(reservation)
                .flashSaleReservationId(reservationId)
                .amount(new BigDecimal("180000"))
                .build();
        PaymentEntity payment = PaymentEntity.builder()
                .amount(new BigDecimal("180000"))
                .method(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.INITIATED)
                .build();
        OrderEntity order = OrderEntity.builder()
                .user(user)
                .itemTotalAmount(new BigDecimal("180000"))
                .finalAmount(new BigDecimal("180000"))
                .payment(payment)
                .build();
        order.setId(orderId);

        OrderCreateRequest request = new OrderCreateRequest();
        request.setCheckoutQuoteId(quoteId);
        request.setPaymentMethod("BANK_TRANSFER");
        request.setMode("BUY_NOW");
        request.setFlashSaleReservationId(reservationId);
        BuyNowItemDto item = new BuyNowItemDto();
        item.setVariantId(variantId.toString());
        item.setQuantity(2);
        request.setBuyNowItem(item);

        CheckoutStrategy strategy = mock(CheckoutStrategy.class);

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(checkoutQuoteService.getValidQuoteForUpdate(quoteId, userId)).thenReturn(quote);
        when(addressRepository.findByIdAndUserId(addressId, userId)).thenReturn(Optional.of(address));
        when(checkoutStrategyResolver.resolve(OrderMode.BUY_NOW, reservationId)).thenReturn(strategy);
        when(strategy.prepareForCreate(request, userId)).thenReturn(context);
        when(orderFactory.buildBuyNowOrder(user, null, variant, 2, PaymentMethod.BANK_TRANSFER, new BigDecimal("90000")))
                .thenReturn(order);
        when(orderRepository.save(order)).thenReturn(order);
        when(orderMapper.toOrderResponse(order)).thenReturn(OrderResponse.builder().id(orderId.toString()).build());

        OrderResponse response = useCase.create(request);

        assertEquals(orderId.toString(), response.getId());
        assertEquals(new BigDecimal("195000"), order.getFinalAmount());
        assertEquals(new BigDecimal("195000"), payment.getAmount());
        verify(flashSaleService).confirmReservation(reservationId, userId, orderId);
        verify(checkoutQuoteService).consumeQuote(quote);
        verify(orderEventPublisher).publishCreated(order);
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
