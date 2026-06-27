package com.nchuy099.SmartPharma.order.application.preview;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.cart.service.CartService;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.event.dto.request.CreateEventRequest;
import com.nchuy099.SmartPharma.event.enums.EventType;
import com.nchuy099.SmartPharma.event.service.EventService;
import com.nchuy099.SmartPharma.order.application.checkout.CheckoutStrategyResolver;
import com.nchuy099.SmartPharma.order.application.checkout.quote.CheckoutQuoteEntity;
import com.nchuy099.SmartPharma.order.application.checkout.quote.CheckoutQuoteService;
import com.nchuy099.SmartPharma.order.application.create.CheckoutContext;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.factory.OrderFactory;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.request.OrderPreviewRequest;
import com.nchuy099.SmartPharma.order.dto.response.PreviewResponse;
import com.nchuy099.SmartPharma.order.infrastructure.shipping.ShippingProvider;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.user.entity.AddressEntity;
import com.nchuy099.SmartPharma.user.repository.AddressRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderPreviewUseCase {

    private final SecurityUtils securityUtils;
    private final CartService cartService;
    private final EventService eventService;
    private final CheckoutStrategyResolver checkoutStrategyResolver;
    private final OrderMapper orderMapper;
    private final AddressRepository addressRepository;
    private final CheckoutQuoteService checkoutQuoteService;
    private final ShippingProvider shippingProvider;
    private final OrderFactory orderFactory;
    private final UserRepository userRepository;

    @Transactional
    public PreviewResponse preview(OrderPreviewRequest request) {
        log.info("Processing {} order preview request", request.getMode());

        UUID currentUserId = securityUtils.getCurrentUserId();
        OrderMode mode = parseMode(request.getMode());

        trackCheckoutEvent(request, currentUserId, mode);

        CheckoutContext context = checkoutStrategyResolver.resolve(mode, request.getFlashSaleReservationId())
                .prepareForPreview(request, currentUserId);

        PreviewResponse response = buildPreviewResponse(context);
        hydrateShippingQuote(response, context, request, currentUserId);
        return response;
    }

    private void trackCheckoutEvent(OrderPreviewRequest request, UUID currentUserId, OrderMode mode) {
        if (mode == OrderMode.BUY_NOW && request.getBuyNowItem() != null) {
            eventService.createEvent(CreateEventRequest.builder()
                    .userId(currentUserId != null ? currentUserId.toString() : null)
                    .eventType(EventType.CHECKOUT)
                    .itemId(request.getBuyNowItem().getVariantId())
                    .build());
            return;
        }

        if (mode == OrderMode.CART) {
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
    }

    private PreviewResponse buildPreviewResponse(CheckoutContext context) {
        if (context.mode() == OrderMode.CART) {
            return orderMapper.toCartPreview(context.cartItems(), context.amount());
        }
        if (context.unitPriceOverride() != null) {
            PreviewResponse response = orderMapper.toBuyNowPreview(context.variant(), context.quantity(), context.amount(),
                    context.unitPriceOverride());
            response.getItems().forEach(item -> item.setFlashSaleReservationId(context.flashSaleReservationId()));
            return response;
        }
        return orderMapper.toBuyNowPreview(context.variant(), context.quantity(), context.amount());
    }

    private void hydrateShippingQuote(PreviewResponse response, CheckoutContext context, OrderPreviewRequest request,
            UUID currentUserId) {
        if (request.getAddressId() == null) {
            return;
        }

        AddressEntity address = addressRepository.findByIdAndUserId(request.getAddressId(), currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Address not found"));

        OrderEntity tempOrder = buildTemporaryOrder(context);
        var shippingMethods = shippingProvider.getAvailableShippingMethods(tempOrder, address.getGhnDistrictId(),
                address.getGhnWardCode());
        response.setShippingMethods(shippingMethods);

        if (shippingMethods.isEmpty()) {
            response.setShippingFee(BigDecimal.ZERO);
            return;
        }

        var selectedMethod = shippingMethods.stream()
                .filter(method -> method.getServiceId().equals(request.getServiceId()))
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
    }

    private OrderEntity buildTemporaryOrder(CheckoutContext context) {
        if (context.mode() == OrderMode.CART) {
            return orderFactory.buildCartOrder(null, null, context.cartItems(), PaymentMethod.VNPAY);
        }
        return orderFactory.buildBuyNowOrder(null, null, context.variant(), context.quantity(), PaymentMethod.VNPAY,
                context.unitPriceOverride());
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

    private OrderMode parseMode(String rawMode) {
        try {
            return OrderMode.valueOf(rawMode);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid order mode: " + rawMode);
        }
    }
}
