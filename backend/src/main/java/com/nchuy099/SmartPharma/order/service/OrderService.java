package com.nchuy099.SmartPharma.order.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.cart.service.CartService;
import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.event.dto.request.CreateEventRequest;
import com.nchuy099.SmartPharma.event.enums.EventType;
import com.nchuy099.SmartPharma.event.service.EventService;
import com.nchuy099.SmartPharma.order.checkout.entity.CheckoutQuoteEntity;
import com.nchuy099.SmartPharma.order.checkout.service.CheckoutQuoteService;
import com.nchuy099.SmartPharma.order.domain.OrderDomainService;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.request.OrderCancelRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;
import com.nchuy099.SmartPharma.order.dto.response.OrderPageResponse;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;
import com.nchuy099.SmartPharma.inventory.service.InventoryDomainService;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.flashsale.dto.response.FlashSaleReservationView;
import com.nchuy099.SmartPharma.user.entity.AddressEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.AddressRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;
    private final OrderDomainService orderDomainService;
    private final InventoryDomainService inventoryDomainService;
    private final OrderMapper orderMapper;
    private final CartService cartService;
    private final AddressRepository addressRepository;
    private final CheckoutQuoteService checkoutQuoteService;
    private final com.nchuy099.SmartPharma.order.ghn.GHNService ghnService;
    private final EventService eventService;
    private final OrderStatusTransitionService orderStatusTransitionService;
    private final FlashSaleService flashSaleService;

    // ===== PREVIEW =====
    @Transactional
    public PreviewResponse preview(OrderPreviewRequest req) {
        log.info("Processing {} order preview request", req.getMode());

        UUID currentUserId = securityUtils.getCurrentUserId();
        OrderMode mode;
        try {
            mode = OrderMode.valueOf(req.getMode());
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid order mode: " + req.getMode());
        }

        if (mode == OrderMode.BUY_NOW) {
            if (req.getBuyNowItem() == null || !org.springframework.util.StringUtils.hasText(req.getBuyNowItem().getVariantId()) || req.getBuyNowItem().getQuantity() == null || req.getBuyNowItem().getQuantity() <= 0) {
                throw new AppException(ErrorCode.BAD_REQUEST, "BUY_NOW requires valid buyNowItem.variantId and quantity > 0");
            }
        }

        // Track CHECKOUT event
        if (mode == OrderMode.BUY_NOW && req.getBuyNowItem() != null) {
            eventService.createEvent(CreateEventRequest.builder()
                    .userId(currentUserId != null ? currentUserId.toString() : null)
                    .eventType(EventType.CHECKOUT)
                    .itemId(req.getBuyNowItem().getVariantId())
                    .build());
        } else if (mode == OrderMode.CART) {
            var items = cartService.getSelectedCartItems(currentUserId);
            items.forEach(cartItem -> {
                if (cartItem.getVariant() != null && cartItem.getVariant().getProduct() != null) {
                    eventService.createEvent(CreateEventRequest.builder()
                            .userId(currentUserId != null ? currentUserId.toString() : null)
                            .eventType(EventType.CHECKOUT)
                            .itemId(cartItem.getVariant().getProduct().getId().toString())
                            .build());
                }
            });
        }

        PreviewResponse response = (mode == OrderMode.BUY_NOW)
                ? previewBuyNow(req)
                : previewCart(req);

        if (req.getAddressId() != null) {
            AddressEntity address = addressRepository.findByIdAndUserId(req.getAddressId(), currentUserId)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Address not found"));

            OrderEntity tempOrder;
            if (mode == OrderMode.BUY_NOW) {
                var buyItem = req.getBuyNowItem();
                var inventory = inventoryDomainService.getInventory(buyItem.getVariantId());
                if (req.getFlashSaleReservationId() != null) {
                    FlashSaleReservationView reservation = flashSaleService.resolveReservationForCheckout(req.getFlashSaleReservationId(), currentUserId);
                    tempOrder = orderDomainService.buildBuyNowOrder(null, null, inventory.getVariant(),
                            buyItem.getQuantity(), PaymentMethod.VNPAY, reservation.getFlashPrice());
                } else {
                    tempOrder = orderDomainService.buildBuyNowOrder(null, null, inventory.getVariant(),
                            buyItem.getQuantity(), PaymentMethod.VNPAY);
                }
            } else {
                UUID userId = securityUtils.getCurrentUserId();
                var cartItems = cartService.getSelectedCartItems(userId);
                tempOrder = orderDomainService.buildCartOrder(null, null, cartItems, PaymentMethod.VNPAY);
            }

            var shippingMethods = ghnService.getAvailableShippingMethods(tempOrder, address.getGhnDistrictId(),
                    address.getGhnWardCode());
            response.setShippingMethods(shippingMethods);

            if (!shippingMethods.isEmpty()) {
                var selectedMethod = shippingMethods.stream()
                        .filter(m -> m.getServiceId().equals(req.getServiceId()))
                        .findFirst()
                        .orElse(shippingMethods.get(0));

                BigDecimal shippingFee = selectedMethod.getFee();
                response.setShippingFee(shippingFee);
                response.setFinalAmount(response.getFinalAmount().add(shippingFee));

                CheckoutQuoteEntity savedQuote = checkoutQuoteService.createQuote(
                        buildCheckoutQuoteEntity(currentUserId, address, selectedMethod));
                response.setCheckoutQuoteId(savedQuote.getId());
                response.setCheckoutQuoteExpiresAt(
                        savedQuote.getExpiresAt() != null ? savedQuote.getExpiresAt().getEpochSecond() : null);
            } else {
                response.setShippingFee(BigDecimal.ZERO);
            }
        }
        return response;
    }

    // ===== CREATE =====
    @Transactional
    public OrderResponse create(OrderCreateRequest req) {
        log.info("Processing order create request for checkout quote: {}", req.getCheckoutQuoteId());

        UUID userId = securityUtils.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found"));

        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(req.getPaymentMethod());
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid payment method: " + req.getPaymentMethod());
        }

        CheckoutQuoteEntity quote = checkoutQuoteService.getValidQuoteForUpdate(req.getCheckoutQuoteId(), userId);
        AddressEntity address = addressRepository.findByIdAndUserId(quote.getAddressId(), userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Address not found"));

        OrderMode mode;
        try {
            mode = OrderMode.valueOf(req.getMode());
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid order mode: " + req.getMode());
        }

        OrderEntity order;
        List<CartItemEntity> cartItems = null;
        try {
            if (mode == OrderMode.BUY_NOW) {
                if (req.getBuyNowItem() == null || !org.springframework.util.StringUtils.hasText(req.getBuyNowItem().getVariantId())
                        || req.getBuyNowItem().getQuantity() == null || req.getBuyNowItem().getQuantity() <= 0) {
                    throw new AppException(ErrorCode.BAD_REQUEST, "BUY_NOW requires valid buyNowItem.variantId and quantity > 0");
                }
                var inventory = inventoryDomainService.getInventory(req.getBuyNowItem().getVariantId());
                if (req.getFlashSaleReservationId() != null) {
                    FlashSaleReservationView reservation = flashSaleService.resolveReservationForCheckout(req.getFlashSaleReservationId(), userId);
                    if (!reservation.getVariantId().toString().equals(req.getBuyNowItem().getVariantId())) {
                        throw new AppException(ErrorCode.CONFLICT, "Flash sale reservation does not match selected item");
                    }
                    if (!reservation.getQuantity().equals(req.getBuyNowItem().getQuantity())) {
                        throw new AppException(ErrorCode.CONFLICT, "Flash sale reservation quantity mismatch");
                    }
                    order = orderDomainService.buildBuyNowOrder(user, req.getNote(), inventory.getVariant(),
                            req.getBuyNowItem().getQuantity(), paymentMethod, reservation.getFlashPrice());
                    order.setFlashSaleReservationId(req.getFlashSaleReservationId());
                } else {
                    inventoryDomainService.reserve(inventory, req.getBuyNowItem().getQuantity());
                    order = orderDomainService.buildBuyNowOrder(user, req.getNote(), inventory.getVariant(),
                            req.getBuyNowItem().getQuantity(), paymentMethod);
                }
            } else {
                cartItems = cartService.getSelectedCartItems(userId);
                inventoryDomainService.reserveCart(cartItems);
                order = orderDomainService.buildCartOrder(user, req.getNote(), cartItems, paymentMethod);
            }

            order.setShippingFee(quote.getShippingFee());
            order.setShippingFullName(address.getFullName());
            order.setShippingPhone(address.getPhoneNumber());
            order.setShippingAddress(address.getAddress());
            order.setGhnDistrictId(address.getGhnDistrictId());
            order.setGhnWardCode(address.getGhnWardCode());
            order.setProvinceName(address.getProvinceName());
            order.setDistrictName(address.getDistrictName());
            order.setWardName(address.getWardName());
            order.setGhnServiceId(quote.getShippingServiceId());
            order.setExpectedDeliveryTime(quote.getExpectedDeliveryTime());
            order.setFinalAmount(order.getItemTotalAmount().add(quote.getShippingFee()));
            if (order.getPayment() != null) {
                order.getPayment().setAmount(order.getFinalAmount());
            }

            orderRepository.save(order);
            if (req.getFlashSaleReservationId() != null && mode == OrderMode.BUY_NOW) {
                flashSaleService.confirmReservation(req.getFlashSaleReservationId(), userId, order.getId());
            }
            if (mode == OrderMode.CART) {
                cartService.removeItems(cartItems);
            }
            checkoutQuoteService.consumeQuote(quote);

            // Track PURCHASE event for each item
            UUID finalUserId = userId;
            order.getItems().forEach(item -> {
                eventService.createEvent(CreateEventRequest.builder()
                        .userId(finalUserId != null ? finalUserId.toString() : null)
                        .eventType(EventType.PURCHASE)
                        .itemId(item.getVariant().getId().toString())
                        .metadata("{\"orderCode\":\"" + order.getOrderCode() + "\"}")
                        .build());
            });

            return orderMapper.toOrderResponse(order);
        } catch (RuntimeException ex) {
            if (mode == OrderMode.BUY_NOW && req.getFlashSaleReservationId() != null) {
                try {
                    flashSaleService.releaseReservation(req.getFlashSaleReservationId(), userId);
                } catch (Exception releaseEx) {
                    log.warn("Failed to release flash sale reservation {} after order failure", req.getFlashSaleReservationId(), releaseEx);
                }
            }
            throw ex;
        }
    }

    @Transactional
    public void cancel(UUID orderId, OrderCancelRequest req) {
        log.info("Processing cancel order request with id: {}", orderId);
        UUID userId = securityUtils.getCurrentUserId();
        OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new AppException(ErrorCode.CONFLICT, "Order is already cancelled");
        }

        orderStatusTransitionService.cancel(order);
        order.setCancelReason(req.getReason());

        order.getItems().forEach(item -> {
            var inventory = inventoryDomainService.getInventory(item.getVariant().getId().toString());
            inventoryDomainService.release(inventory, item.getQuantity());
        });

        if (order.getFlashSaleReservationId() != null) {
            flashSaleService.releaseReservation(order.getFlashSaleReservationId(), userId);
        }

        orderRepository.save(order);
    }

    @Transactional
    public OrderResponse confirmOrder(UUID orderId) {
        log.info("Processing confirm order request with id: {}", orderId);
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));

        orderStatusTransitionService.confirm(order);
        orderRepository.save(order);

        return orderMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse shipOrder(UUID orderId) {
        log.info("Processing ship order request with id: {}", orderId);
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));

        orderStatusTransitionService.ensureCanShip(order);
        String ghnOrderCode = ghnService.createGHNShipment(
                order,
                order.getGhnDistrictId(),
                order.getGhnWardCode(),
                order.getShippingAddress(),
                order.getShippingFullName(),
                order.getShippingPhone(),
                order.getProvinceName(),
                order.getDistrictName(),
                order.getWardName());

        order.setGhnOrderCode(ghnOrderCode);
        orderStatusTransitionService.ship(order);

        // Export stock (reserved -= qty)
        inventoryDomainService.exportOrder(order);

        orderRepository.save(order);

        return orderMapper.toOrderResponse(order);
    }

    // Get details
    @Transactional
    public OrderResponse getDetails(UUID orderId) {
        log.info("Processing get order detail request");
        UUID userId = securityUtils.getCurrentUserId();
        OrderEntity order = orderRepository.findByIdAndUserId(orderId,
                userId).orElseThrow(
                        () -> {
                            log.warn("Order information missing");
                            throw new AppException(ErrorCode.NOT_FOUND, "Order information missing");
                        });

        var ghnDetail = ghnService.getShipmentDetails(order.getGhnOrderCode());
        if (ghnDetail != null && ghnDetail.getStatus() != null) {
            orderStatusTransitionService.syncFromGhn(order, ghnDetail.getStatus());
            orderRepository.save(order);
        }
        return orderMapper.toOrderResponseWithLogs(order, ghnDetail);
    }

    @Transactional
    public OrderResponse trackShipment(String ghnOrderCode) {
        log.info("Tracking shipment with GHN Order Code: {}", ghnOrderCode);
        OrderEntity order = orderRepository.findByGhnOrderCode(ghnOrderCode)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND,
                        "Order not found with GHN code: " + ghnOrderCode));

        var ghnDetail = ghnService.getShipmentDetails(ghnOrderCode);

        if (ghnDetail != null && ghnDetail.getStatus() != null) {
            orderStatusTransitionService.syncFromGhn(order, ghnDetail.getStatus());
            orderRepository.save(order);
        }

        return orderMapper.toOrderResponseWithLogs(order, ghnDetail);
    }

    private CheckoutQuoteEntity buildCheckoutQuoteEntity(UUID userId, AddressEntity address,
            PreviewResponse.ShippingMethodDto selectedMethod) {
        Long expectedDeliveryTime = selectedMethod.getExpectedDeliveryTime();
        if (expectedDeliveryTime == null) {
            expectedDeliveryTime = Instant.now().plusSeconds(24 * 60 * 60).getEpochSecond();
        }
        return CheckoutQuoteEntity.builder()
                .user(userRepository.getReferenceById(userId))
                .addressId(address.getId())
                .shippingFee(selectedMethod.getFee())
                .shippingServiceId(selectedMethod.getServiceId())
                .expectedDeliveryTime(expectedDeliveryTime)
                .build();
    }

    // Get details for admin
    @Transactional
    public OrderResponse getDetailsForAdmin(UUID orderId) {
        log.info("Processing get order detail for admin request");
        OrderEntity order = orderRepository.findById(orderId).orElseThrow(
                () -> {
                    log.warn("Order not found");
                    throw new AppException(ErrorCode.NOT_FOUND, "Order not found");
                });

        var ghnDetail = ghnService.getShipmentDetails(order.getGhnOrderCode());
        if (ghnDetail != null && ghnDetail.getStatus() != null) {
            orderStatusTransitionService.syncFromGhn(order, ghnDetail.getStatus());
            orderRepository.save(order);
        }
        return orderMapper.toOrderResponseWithLogs(order, ghnDetail);
    }

    // Get order history
    public OrderPageResponse getUserOrderHistory(int page, int size) {
        log.info("Fetching order history list for user");
        UUID userId = securityUtils.getCurrentUserId();

        if (page > 0)
            page--;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));

        Page<OrderEntity> orderPage = orderRepository.findByUserId(userId, pageable);
        List<UUID> orderIds = orderPage.getContent().stream().map(OrderEntity::getId).toList();

        if (orderIds.isEmpty()) {
            return OrderPageResponse.builder()
                    .orders(List.of())
                    .pagination(Pagination.builder()
                            .page(page + 1)
                            .size(size)
                            .totalPages(orderPage.getTotalPages())
                            .totalElements(orderPage.getTotalElements())
                            .build())
                    .build();
        }

        List<OrderEntity> ordersWithDetails = orderRepository.findAllWithItemsAndPayment(orderIds);
        Map<UUID, OrderEntity> orderMap = ordersWithDetails.stream()
                .collect(Collectors.toMap(OrderEntity::getId, Function.identity()));
        Map<UUID, OrderEntity> pagedOrderMap = orderPage.getContent().stream()
                .collect(Collectors.toMap(OrderEntity::getId, Function.identity()));

        List<OrderResponse> orderResponses = orderIds.stream()
                .map(orderId -> orderMap.getOrDefault(orderId, pagedOrderMap.get(orderId)))
                .map(orderMapper::toOrderResponse)
                .toList();

        return OrderPageResponse.builder()
                .orders(orderResponses)
                .pagination(Pagination.builder()
                        .page(page + 1)
                        .size(size)
                        .totalPages(orderPage.getTotalPages())
                        .totalElements(orderPage.getTotalElements())
                        .build())
                .build();
    }

    private OrderStatus parseAdminOrderStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        try {
            return OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            log.warn("Ignoring invalid admin order status filter: {}", status);
            return null;
        }
    }

    public OrderPageResponse getOrderList(int page, int size) {
        return getOrderList(page, size, null, null);
    }

    @Transactional
    public OrderPageResponse getOrderList(int page, int size, String search, String status) {
        log.info("Fetching order list for admin (search={}, status={})", search, status);

        if (page > 0)
            page--;
        Pageable pageable = PageRequest.of(page, size);
        String normalizedSearch = search == null ? null : search.trim();
        if (normalizedSearch != null && normalizedSearch.isEmpty()) {
            normalizedSearch = null;
        }

        Page<UUID> orderIdsPage = orderRepository.findAdminOrderIds(
                normalizedSearch,
                parseAdminOrderStatus(status),
                pageable);

        if (orderIdsPage.isEmpty()) {
            return OrderPageResponse.builder()
                    .orders(List.of())
                    .pagination(Pagination.builder()
                            .page(page + 1)
                            .size(size)
                            .totalPages(orderIdsPage.getTotalPages())
                            .totalElements(orderIdsPage.getTotalElements())
                            .build())
                    .build();
        }

        List<OrderEntity> ordersWithDetails = orderRepository.findAllWithItemsAndPayment(orderIdsPage.getContent());
        Map<UUID, OrderEntity> orderMap = ordersWithDetails.stream()
                .collect(Collectors.toMap(OrderEntity::getId, Function.identity()));

        for (OrderEntity order : ordersWithDetails) {
            syncOrderStatusFromGhn(order);
        }

        return OrderPageResponse.builder()
                .orders(orderIdsPage.getContent().stream()
                        .map(orderMap::get)
                        .filter(java.util.Objects::nonNull)
                        .map(orderMapper::toOrderResponse)
                        .toList())
                .pagination(Pagination.builder()
                        .page(page + 1)
                        .size(size)
                        .totalPages(orderIdsPage.getTotalPages())
                        .totalElements(orderIdsPage.getTotalElements())
                        .build())
                .build();
    }

    private void syncOrderStatusFromGhn(OrderEntity order) {
        if (order == null) {
            return;
        }

        String ghnOrderCode = order.getGhnOrderCode();
        if (ghnOrderCode == null || ghnOrderCode.isBlank()) {
            return;
        }

        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }

        var ghnDetail = ghnService.getShipmentDetails(ghnOrderCode);
        if (ghnDetail != null && ghnDetail.getStatus() != null) {
            orderStatusTransitionService.syncFromGhn(order, ghnDetail.getStatus());
            orderRepository.save(order);
        }
    }

    private PreviewResponse previewBuyNow(OrderPreviewRequest req) {
        var item = req.getBuyNowItem();

        var inventory = inventoryDomainService.getInventory(item.getVariantId());
        var variant = inventory.getVariant();
        if (req.getFlashSaleReservationId() != null) {
            UUID userId = securityUtils.getCurrentUserId();
            FlashSaleReservationView reservation = flashSaleService.resolveReservationForCheckout(req.getFlashSaleReservationId(), userId);
            if (!reservation.getVariantId().toString().equals(item.getVariantId())) {
                throw new AppException(ErrorCode.CONFLICT, "Flash sale reservation does not match selected item");
            }
            if (!reservation.getQuantity().equals(item.getQuantity())) {
                throw new AppException(ErrorCode.CONFLICT, "Flash sale reservation quantity mismatch");
            }
            var amount = orderDomainService.calculateAmount(variant, item.getQuantity(), reservation.getFlashPrice());
            PreviewResponse response = orderMapper.toBuyNowPreview(variant, item.getQuantity(), amount, reservation.getFlashPrice());
            response.getItems().forEach(previewItem -> previewItem.setFlashSaleReservationId(req.getFlashSaleReservationId()));
            return response;
        }

        inventoryDomainService.ensureAvailable(inventory, item.getQuantity());
        var amount = orderDomainService.calculateAmount(variant, item.getQuantity());
        return orderMapper.toBuyNowPreview(variant, item.getQuantity(), amount);
    }

    private PreviewResponse previewCart(OrderPreviewRequest req) {
        UUID userId = securityUtils.getCurrentUserId();

        var cartItems = cartService.getSelectedCartItems(userId);
        inventoryDomainService.ensureCartAvailable(cartItems);

        var amount = orderDomainService.calculateCartAmount(cartItems);

        return orderMapper.toCartPreview(cartItems, amount);
    }

}
