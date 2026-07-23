package com.nchuy099.SmartPharma.order.domain.factory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.cart.entity.CartItemEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.service.OrderAmountCalculator;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;
import com.nchuy099.SmartPharma.product.entity.ProductVariantEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderFactory {

    private final OrderItemFactory orderItemFactory;
    private final OrderAmountCalculator orderAmountCalculator;

    public OrderEntity buildBuyNowOrder(UserEntity user, String note, ProductVariantEntity variant, int qty,
            PaymentMethod paymentMethod, BigDecimal unitPriceOverride) {
        OrderItemEntity item = orderItemFactory.fromBuyNow(variant, qty, unitPriceOverride);
        BigDecimal amount = item.calculateTotalPrice();

        OrderEntity order = OrderEntity.builder()
                .user(user)
                .note(note)
                .orderCode(generateOrderCode())
                .status(determineInitialStatus(paymentMethod))
                .itemTotalAmount(amount)
                .finalAmount(amount)
                .build();

        order.addItem(item);
        order.setPayment(buildPayment(amount, paymentMethod));
        return order;
    }

    public OrderEntity buildCartOrder(UserEntity user, String note, List<CartItemEntity> cartItems,
            PaymentMethod paymentMethod) {
        BigDecimal amount = orderAmountCalculator.calculateCartAmount(cartItems);
        Map<UUID, BigDecimal> unitCostCache = orderAmountCalculator.newCostCache();

        OrderEntity order = OrderEntity.builder()
                .user(user)
                .note(note)
                .orderCode(generateOrderCode())
                .status(determineInitialStatus(paymentMethod))
                .itemTotalAmount(amount)
                .finalAmount(amount)
                .build();

        cartItems.stream()
                .map(item -> orderItemFactory.fromCartItem(item, unitCostCache))
                .forEach(order::addItem);

        order.setPayment(buildPayment(amount, paymentMethod));
        return order;
    }

    private OrderStatus determineInitialStatus(PaymentMethod method) {
        return method == PaymentMethod.BANK_TRANSFER
                ? OrderStatus.PENDING_PAYMENT
                : OrderStatus.PENDING_CONFIRMATION;
    }

    private PaymentEntity buildPayment(BigDecimal amount, PaymentMethod method) {
        return PaymentEntity.builder()
                .amount(amount)
                .method(method)
                .status(PaymentStatus.PENDING)
                .build();
    }

    private String generateOrderCode() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        String randomPart = generateRandomString(8);
        return "ORD" + datePart + randomPart;
    }

    private String generateRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
