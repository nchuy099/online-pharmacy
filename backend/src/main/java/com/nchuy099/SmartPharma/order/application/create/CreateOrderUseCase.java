package com.nchuy099.SmartPharma.order.application.create;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.order.application.checkout.CheckoutStrategyResolver;
import com.nchuy099.SmartPharma.order.application.checkout.quote.CheckoutQuoteEntity;
import com.nchuy099.SmartPharma.order.application.checkout.quote.CheckoutQuoteService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderMode;
import com.nchuy099.SmartPharma.order.domain.factory.OrderFactory;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.request.OrderCreateRequest;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderEventPublisher;
import com.nchuy099.SmartPharma.user.entity.AddressEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.AddressRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.cart.service.CartService;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CreateOrderUseCase {

    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CheckoutQuoteService checkoutQuoteService;
    private final CheckoutStrategyResolver checkoutStrategyResolver;
    private final OrderFactory orderFactory;
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final FlashSaleService flashSaleService;
    private final CartService cartService;
    private final OrderEventPublisher orderEventPublisher;

    @Transactional
    public OrderResponse create(OrderCreateRequest request) {
        log.info("Processing order create request for checkout quote: {}", request.getCheckoutQuoteId());

        UUID userId = securityUtils.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found"));
        PaymentMethod paymentMethod = parsePaymentMethod(request.getPaymentMethod());

        CheckoutQuoteEntity quote = checkoutQuoteService.getValidQuoteForUpdate(request.getCheckoutQuoteId(), userId);
        AddressEntity address = addressRepository.findByIdAndUserId(quote.getAddressId(), userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Address not found"));

        OrderMode mode = parseMode(request.getMode());

        try {
            CheckoutContext context = checkoutStrategyResolver.resolve(mode, request.getFlashSaleReservationId())
                    .prepareForCreate(request, userId);

            OrderEntity order = buildOrder(user, request, paymentMethod, context);
            applyShipping(order, quote, address);

            orderRepository.save(order);
            if (context.flashSaleReservationId() != null && mode == OrderMode.BUY_NOW) {
                flashSaleService.confirmReservation(context.flashSaleReservationId(), userId, order.getId());
            }
            if (mode == OrderMode.CART) {
                cartService.removeItems(context.cartItems());
            }
            checkoutQuoteService.consumeQuote(quote);
            orderEventPublisher.publishCreated(order);
            return orderMapper.toOrderResponse(order);
        } catch (RuntimeException ex) {
            if (request.getFlashSaleReservationId() != null && mode == OrderMode.BUY_NOW) {
                try {
                    flashSaleService.releaseReservation(request.getFlashSaleReservationId(), userId);
                } catch (Exception releaseEx) {
                    log.warn("Failed to release flash sale reservation {} after order failure",
                            request.getFlashSaleReservationId(), releaseEx);
                }
            }
            throw ex;
        }
    }

    private OrderEntity buildOrder(UserEntity user, OrderCreateRequest request, PaymentMethod paymentMethod,
            CheckoutContext context) {
        OrderEntity order = context.mode() == OrderMode.CART
                ? orderFactory.buildCartOrder(user, request.getNote(), context.cartItems(), paymentMethod)
                : orderFactory.buildBuyNowOrder(user, request.getNote(), context.variant(), context.quantity(),
                        paymentMethod, context.unitPriceOverride());
        if (context.flashSaleReservationId() != null) {
            order.setFlashSaleReservationId(context.flashSaleReservationId());
        }
        return order;
    }

    private void applyShipping(OrderEntity order, CheckoutQuoteEntity quote, AddressEntity address) {
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
    }

    private PaymentMethod parsePaymentMethod(String rawMethod) {
        try {
            return PaymentMethod.valueOf(rawMethod);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid payment method: " + rawMethod);
        }
    }

    private OrderMode parseMode(String rawMode) {
        try {
            return OrderMode.valueOf(rawMode);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid order mode: " + rawMode);
        }
    }
}
