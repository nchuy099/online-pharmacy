package com.nchuy099.SmartPharma.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.inventory.entity.InventoryEntity;
import com.nchuy099.SmartPharma.order.domain.OrderDomainService;
import com.nchuy099.SmartPharma.order.checkout.entity.CheckoutQuoteEntity;
import com.nchuy099.SmartPharma.order.checkout.service.CheckoutQuoteService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.order.domain.enums.PaymentStatus;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.request.BuyNowItemDto;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.dto.response.OrderPageResponse;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;
import com.nchuy099.SmartPharma.order.ghn.dto.OrderDetailResponseDTO;
import com.nchuy099.SmartPharma.inventory.service.InventoryDomainService;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.user.entity.AddressEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.AddressRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class OrderServiceTest {

    private OrderRepository orderRepository;
    private SecurityUtils securityUtils;
    private OrderMapper orderMapper;
    private OrderDomainService orderDomainService;
    private InventoryDomainService inventoryDomainService;
    private UserRepository userRepository;
    private AddressRepository addressRepository;
    private CheckoutQuoteService checkoutQuoteService;
    private com.nchuy099.SmartPharma.order.ghn.GHNService ghnService;
    private OrderStatusTransitionService orderStatusTransitionService;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        securityUtils = mock(SecurityUtils.class);
        orderMapper = mock(OrderMapper.class);
        orderDomainService = mock(OrderDomainService.class);
        inventoryDomainService = mock(InventoryDomainService.class);
        userRepository = mock(UserRepository.class);
        addressRepository = mock(AddressRepository.class);
        checkoutQuoteService = mock(CheckoutQuoteService.class);
        ghnService = mock(com.nchuy099.SmartPharma.order.ghn.GHNService.class);
        orderStatusTransitionService = spy(new OrderStatusTransitionService());

        orderService = new OrderService(
                orderRepository,
                securityUtils,
                userRepository,
                orderDomainService,
                inventoryDomainService,
                orderMapper,
                mock(com.nchuy099.SmartPharma.cart.service.CartService.class),
                addressRepository,
                checkoutQuoteService,
                ghnService,
                mock(com.nchuy099.SmartPharma.event.service.EventService.class),
                orderStatusTransitionService);
    }

    @Test
    void getUserOrderHistoryShouldReturnEmptyOrdersWhenPageIsEmpty() {
        UUID userId = UUID.randomUUID();
        Page<OrderEntity> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(orderRepository.findByUserId(eq(userId), any())).thenReturn(emptyPage);
        when(orderRepository.findAllWithItemsAndPayment(List.of()))
                .thenThrow(new RuntimeException("DB does not allow IN ()"));

        OrderPageResponse response = orderService.getUserOrderHistory(1, 10);

        assertNotNull(response);
        assertNotNull(response.getOrders());
        assertTrue(response.getOrders().isEmpty());
        assertEquals(1, response.getPagination().getPage());
        assertEquals(10, response.getPagination().getSize());
        assertEquals(0, response.getPagination().getTotalPages());
        assertEquals(0, response.getPagination().getTotalElements());
    }

    @Test
    void getUserOrderHistoryShouldFallbackToPagedOrdersWhenDetailQueryMissesSomeIds() {
        UUID userId = UUID.randomUUID();
        OrderEntity order = new OrderEntity();
        UUID orderId = UUID.randomUUID();
        order.setId(orderId);

        Page<OrderEntity> pageWithOneOrder = new PageImpl<>(List.of(order), PageRequest.of(0, 10), 1);
        OrderResponse mappedResponse = OrderResponse.builder().id(orderId.toString()).build();

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(orderRepository.findByUserId(eq(userId), any())).thenReturn(pageWithOneOrder);
        when(orderRepository.findAllWithItemsAndPayment(List.of(orderId))).thenReturn(List.of());
        when(orderMapper.toOrderResponse(any())).thenAnswer(invocation -> {
            OrderEntity arg = invocation.getArgument(0);
            if (arg == null) {
                throw new NullPointerException("order is null");
            }
            return mappedResponse;
        });

        OrderPageResponse response = assertDoesNotThrow(() -> orderService.getUserOrderHistory(1, 10));

        assertNotNull(response);
        assertEquals(1, response.getOrders().size());
        assertEquals(orderId.toString(), response.getOrders().get(0).getId());
    }

    @Test
    void getOrderListShouldFilterBySearchAndStatus() {
        OrderEntity order = new OrderEntity();
        UUID orderId = UUID.randomUUID();
        order.setId(orderId);
        order.setOrderCode("ORD-2026-0001");

        Page<UUID> idsPage = new PageImpl<>(List.of(orderId), PageRequest.of(0, 10), 1);
        OrderResponse mappedResponse = OrderResponse.builder().id(orderId.toString()).build();

        when(orderRepository.findAdminOrderIds(eq("ORD-2026"), eq(OrderStatus.DELIVERED), any()))
                .thenReturn(idsPage);
        when(orderRepository.findAllWithItemsAndPayment(List.of(orderId))).thenReturn(List.of(order));
        when(orderMapper.toOrderResponse(order)).thenReturn(mappedResponse);

        OrderPageResponse response = orderService.getOrderList(1, 10, "ORD-2026", "DELIVERED");

        assertNotNull(response);
        assertEquals(1, response.getOrders().size());
        assertEquals(orderId.toString(), response.getOrders().get(0).getId());
        assertEquals(1, response.getPagination().getPage());
        assertEquals(10, response.getPagination().getSize());
    }

    @Test
    void getOrderListShouldSyncGhnStatusBeforeReturningAdminRows() {
        OrderEntity order = new OrderEntity();
        UUID orderId = UUID.randomUUID();
        order.setId(orderId);
        order.setOrderCode("ORD-2026-0002");
        order.setGhnOrderCode("GHN-123");
        order.setStatus(OrderStatus.SHIPPING);

        Page<UUID> idsPage = new PageImpl<>(List.of(orderId), PageRequest.of(0, 10), 1);
        OrderResponse mappedResponse = OrderResponse.builder().id(orderId.toString()).status(OrderStatus.DELIVERED.toString()).build();

        OrderDetailResponseDTO ghnDetail = new OrderDetailResponseDTO();
        ghnDetail.setOrderCode("GHN-123");
        ghnDetail.setStatus("delivered");

        when(orderRepository.findAdminOrderIds(eq(null), eq(null), any()))
                .thenReturn(idsPage);
        when(orderRepository.findAllWithItemsAndPayment(List.of(orderId))).thenReturn(List.of(order));
        when(orderMapper.toOrderResponse(order)).thenReturn(mappedResponse);
        when(ghnService.getShipmentDetails("GHN-123")).thenReturn(ghnDetail);

        OrderPageResponse response = orderService.getOrderList(1, 10, null, null);

        assertNotNull(response);
        assertEquals(OrderStatus.DELIVERED.toString(), response.getOrders().get(0).getStatus());
        assertEquals(OrderStatus.DELIVERED, order.getStatus());
        verify(orderRepository).save(order);
        verify(orderStatusTransitionService).syncFromGhn(order, "delivered");
    }

    @Test
    void previewShouldPersistCheckoutSnapshotWhenAddressIsProvided() {
        UUID userId = UUID.randomUUID();
        UUID addressId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();

        UserEntity user = new UserEntity();
        user.setId(userId);

        AddressEntity address = AddressEntity.builder()
                .fullName("Nguyen Van A")
                .phoneNumber("0900000000")
                .address("123 Le Loi")
                .ghnDistrictId(2)
                .ghnWardCode("W1")
                .provinceName("Ho Chi Minh")
                .districtName("District 1")
                .wardName("Ward 1")
                .build();
        address.setId(addressId);

        ProductEntity product = ProductEntity.builder()
                .name("Paracetamol")
                .slug("paracetamol")
                .webName("Paracetamol")
                .build();
        product.setId(UUID.randomUUID());

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .product(product)
                .sku("PARA-500")
                .unitType("box")
                .salePrice(new BigDecimal("120000"))
                .build();
        variant.setId(variantId);

        var inventory = InventoryEntity.builder()
                .variant(variant)
                .quantityOnHand(10)
                .quantityReserved(0)
                .build();

        var tempOrder = OrderEntity.builder()
                .orderCode("ORD260514ABCD1234")
                .status(OrderStatus.PENDING)
                .itemTotalAmount(new BigDecimal("240000"))
                .finalAmount(new BigDecimal("240000"))
                .build();
        tempOrder.setPayment(PaymentEntity.builder()
                .amount(new BigDecimal("240000"))
                .method(PaymentMethod.VNPAY)
                .status(PaymentStatus.INITIATED)
                .build());

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));
        when(addressRepository.findByIdAndUserId(addressId, userId)).thenReturn(java.util.Optional.of(address));
        when(inventoryDomainService.getInventory(variantId.toString())).thenReturn(inventory);
        when(orderDomainService.calculateAmount(variant, 2)).thenReturn(new BigDecimal("240000"));
        when(orderDomainService.buildBuyNowOrder(null, null, variant, 2, PaymentMethod.VNPAY))
                .thenReturn(tempOrder);
        when(ghnService.getAvailableShippingMethods(tempOrder, address.getGhnDistrictId(), address.getGhnWardCode()))
                .thenReturn(List.of(PreviewResponse.ShippingMethodDto.builder()
                        .serviceId(2)
                        .serviceTypeId(1)
                        .name("Express")
                        .fee(new BigDecimal("18000"))
                        .expectedDeliveryTime(1_725_876_000L)
                        .build()));
        when(orderMapper.toBuyNowPreview(eq(variant), eq(2), any(BigDecimal.class)))
                .thenReturn(PreviewResponse.builder()
                        .itemTotalAmount(new BigDecimal("240000"))
                        .finalAmount(new BigDecimal("240000"))
                        .shippingFee(BigDecimal.ZERO)
                        .items(List.of())
                        .build());
        when(checkoutQuoteService.createQuote(any(CheckoutQuoteEntity.class)))
                .thenAnswer(invocation -> {
                    CheckoutQuoteEntity quote = invocation.getArgument(0);
                    quote.setId(UUID.randomUUID());
                    quote.setExpiresAt(Instant.now().plusSeconds(300));
                    return quote;
                });

        OrderPreviewRequest req = new OrderPreviewRequest();
        req.setMode("BUY_NOW");
        req.setAddressId(addressId);
        req.setServiceId(2);
        req.setNote("Giao giờ hành chính");
        BuyNowItemDto buyNowItem = new BuyNowItemDto();
        buyNowItem.setVariantId(variantId.toString());
        buyNowItem.setQuantity(2);
        req.setBuyNowItem(buyNowItem);

        PreviewResponse response = orderService.preview(req);

        assertNotNull(response);
        assertNotNull(response.getCheckoutQuoteId());
        assertNotNull(response.getCheckoutQuoteExpiresAt());
        assertEquals(new BigDecimal("18000"), response.getShippingFee());
        assertEquals(new BigDecimal("258000"), response.getFinalAmount());
        assertEquals(1, response.getShippingMethods().size());
    }

    @Test
    void createShouldUseCheckoutQuoteAndLiveItemsWithoutCallingGhn() {
        UUID userId = UUID.randomUUID();
        UUID quoteId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        UUID addressId = UUID.randomUUID();

        UserEntity user = new UserEntity();
        user.setId(userId);

        AddressEntity address = AddressEntity.builder()
                .fullName("Nguyen Van A")
                .phoneNumber("0900000000")
                .address("123 Le Loi")
                .ghnDistrictId(2)
                .ghnWardCode("W1")
                .provinceName("Ho Chi Minh")
                .districtName("District 1")
                .wardName("Ward 1")
                .build();
        address.setId(addressId);

        ProductEntity product = ProductEntity.builder()
                .name("Paracetamol")
                .slug("paracetamol")
                .webName("Paracetamol")
                .build();
        product.setId(UUID.randomUUID());

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .product(product)
                .sku("PARA-500")
                .unitType("box")
                .salePrice(new BigDecimal("120000"))
                .build();
        variant.setId(variantId);

        CheckoutQuoteEntity quote = CheckoutQuoteEntity.builder()
                .addressId(addressId)
                .shippingFee(new BigDecimal("18000"))
                .shippingServiceId(2)
                .expectedDeliveryTime(1_725_876_000L)
                .expiresAt(Instant.now().plusSeconds(300))
                .build();
        quote.setId(quoteId);

        var inventory = InventoryEntity.builder()
                .variant(variant)
                .quantityOnHand(10)
                .quantityReserved(0)
                .build();

        var payment = PaymentEntity.builder()
                .amount(new BigDecimal("258000"))
                .method(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.INITIATED)
                .build();
        OrderEntity order = OrderEntity.builder()
                .orderCode("ORD260514ABCD1234")
                .status(OrderStatus.PENDING)
                .itemTotalAmount(new BigDecimal("240000"))
                .finalAmount(new BigDecimal("258000"))
                .shippingFee(new BigDecimal("18000"))
                .shippingFullName("Nguyen Van A")
                .shippingPhone("0900000000")
                .shippingAddress("123 Le Loi")
                .ghnDistrictId(2)
                .ghnWardCode("W1")
                .provinceName("Ho Chi Minh")
                .districtName("District 1")
                .wardName("Ward 1")
                .ghnServiceId(2)
                .expectedDeliveryTime(1_725_876_000L)
                .build();
        order.addItem(OrderItemEntity.builder()
                .product(product)
                .variant(variant)
                .quantity(2)
                .unitPrice(new BigDecimal("120000"))
                .totalPrice(new BigDecimal("240000"))
                .snapshotProductName(product.getName())
                .snapshotSku(variant.getSku())
                .snapshotUnit(variant.getUnit())
                .snapshotPrimaryImage(null)
                .build());
        order.setPayment(payment);

        OrderCreateRequest req = new OrderCreateRequest();
        req.setCheckoutQuoteId(quoteId);
        req.setPaymentMethod("BANK_TRANSFER");
        req.setMode("BUY_NOW");
        req.setNote("Giao giờ hành chính");
        BuyNowItemDto buyNowItem = new BuyNowItemDto();
        buyNowItem.setVariantId(variantId.toString());
        buyNowItem.setQuantity(2);
        req.setBuyNowItem(buyNowItem);

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));
        when(checkoutQuoteService.getValidQuoteForUpdate(quoteId, userId)).thenReturn(quote);
        when(addressRepository.findByIdAndUserId(addressId, userId)).thenReturn(java.util.Optional.of(address));
        when(inventoryDomainService.getInventory(variantId.toString())).thenReturn(inventory);
        when(orderDomainService.buildBuyNowOrder(user, "Giao giờ hành chính", variant, 2, PaymentMethod.BANK_TRANSFER))
                .thenReturn(order);
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toOrderResponse(any(OrderEntity.class)))
                .thenReturn(OrderResponse.builder().id(order.getOrderCode()).build());

        OrderResponse response = orderService.create(req);

        assertNotNull(response);
        assertEquals(order.getOrderCode(), response.getId());
        assertEquals(new BigDecimal("258000"), order.getFinalAmount());
        assertEquals(new BigDecimal("258000"), order.getPayment().getAmount());
        assertEquals(new BigDecimal("18000"), order.getShippingFee());
        assertEquals(Integer.valueOf(2), order.getGhnServiceId());
        assertEquals(Long.valueOf(1_725_876_000L), order.getExpectedDeliveryTime());
        verifyNoInteractions(ghnService);
    }

    @Test
    void confirmOrderShouldDelegateStatusChangeToTransitionService() {
        UUID orderId = UUID.randomUUID();
        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setStatus(OrderStatus.PENDING);

        when(orderRepository.findById(orderId)).thenReturn(java.util.Optional.of(order));
        when(orderMapper.toOrderResponse(order)).thenReturn(OrderResponse.builder().id(orderId.toString()).build());

        OrderResponse response = orderService.confirmOrder(orderId);

        assertEquals(orderId.toString(), response.getId());
        verify(orderStatusTransitionService).confirm(order);
        verify(orderRepository).save(order);
    }

    @Test
    void shipOrderShouldValidateAndDelegateStatusChangeToTransitionService() {
        UUID orderId = UUID.randomUUID();
        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setStatus(OrderStatus.PROCESSING);

        when(orderRepository.findById(orderId)).thenReturn(java.util.Optional.of(order));
        when(ghnService.createGHNShipment(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn("GHN-123");
        when(orderMapper.toOrderResponse(order)).thenReturn(OrderResponse.builder().id(orderId.toString()).build());

        OrderResponse response = orderService.shipOrder(orderId);

        assertEquals(orderId.toString(), response.getId());
        verify(orderStatusTransitionService).ensureCanShip(order);
        verify(orderStatusTransitionService).ship(order);
        assertEquals("GHN-123", order.getGhnOrderCode());
        verify(orderRepository).save(order);
    }

    @Test
    void cancelShouldDelegateStatusChangeToTransitionService() {
        UUID userId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setStatus(OrderStatus.PENDING);
        order.setItems(List.of());

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(orderRepository.findByIdAndUserId(orderId, userId)).thenReturn(java.util.Optional.of(order));

        orderService.cancel(orderId, new com.nchuy099.SmartPharma.order.dto.request.OrderCancelRequest());

        verify(orderStatusTransitionService).cancel(order);
        verify(orderRepository).save(order);
    }
}
