package com.nchuy099.SmartPharma.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;

class OrderStatusTransitionServiceTest {

    private OrderStatusTransitionService transitionService;

    @BeforeEach
    void setUp() {
        transitionService = new OrderStatusTransitionService();
    }

    @Test
    void confirmShouldMovePendingOrderToProcessing() {
        OrderEntity order = orderWithStatus(OrderStatus.PENDING);

        transitionService.confirm(order);

        assertEquals(OrderStatus.PROCESSING, order.getStatus());
    }

    @Test
    void partialPaymentShouldMovePendingOrderToPendingPayment() {
        OrderEntity order = orderWithStatus(OrderStatus.PENDING);

        transitionService.markPartialPayment(order);

        assertEquals(OrderStatus.PENDING_PAYMENT, order.getStatus());
    }

    @Test
    void paymentSuccessShouldMovePendingPaymentOrderToPending() {
        OrderEntity order = orderWithStatus(OrderStatus.PENDING_PAYMENT);

        transitionService.markPaymentSuccess(order);

        assertEquals(OrderStatus.PENDING, order.getStatus());
    }

    @Test
    void confirmShouldRejectPendingPaymentOrders() {
        OrderEntity order = orderWithStatus(OrderStatus.PENDING_PAYMENT);

        assertThrows(AppException.class, () -> transitionService.confirm(order));
    }

    @Test
    void ghnSyncShouldNotMoveOrderBackwards() {
        OrderEntity order = orderWithStatus(OrderStatus.DELIVERED);

        transitionService.syncFromGhn(order, "shipping");

        assertEquals(OrderStatus.DELIVERED, order.getStatus());
    }

    @Test
    void cancelShouldRejectDeliveredOrders() {
        OrderEntity order = orderWithStatus(OrderStatus.DELIVERED);

        assertThrows(AppException.class, () -> transitionService.cancel(order));
    }

    private OrderEntity orderWithStatus(OrderStatus status) {
        return OrderEntity.builder()
                .status(status)
                .finalAmount(new BigDecimal("1000"))
                .build();
    }
}
