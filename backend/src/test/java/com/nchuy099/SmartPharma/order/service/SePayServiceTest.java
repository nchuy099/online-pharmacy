package com.nchuy099.SmartPharma.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.order.domain.enums.PaymentStatus;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.domain.repository.PaymentRepository;
import com.nchuy099.SmartPharma.order.dto.request.SePayWebhookRequest;

class SePayServiceTest {

    private OrderRepository orderRepository;
    private PaymentRepository paymentRepository;
    private OrderStatusTransitionService orderStatusTransitionService;
    private SePayService sePayService;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        orderStatusTransitionService = spy(new OrderStatusTransitionService());

        sePayService = new SePayService(orderRepository, paymentRepository, orderStatusTransitionService);
        ReflectionTestUtils.setField(sePayService, "sepayApiKey", "secret");
        ReflectionTestUtils.setField(sePayService, "accountNumber", "0123499999");
        ReflectionTestUtils.setField(sePayService, "bankName", "MBBank");
    }

    @Test
    void processWebhookShouldPersistPartialPaymentTransition() {
        String orderCode = "ORD260514ABCD1234";
        UUID paymentId = UUID.randomUUID();

        OrderEntity order = OrderEntity.builder()
                .orderCode(orderCode)
                .status(OrderStatus.PENDING)
                .finalAmount(new BigDecimal("1000"))
                .build();
        PaymentEntity payment = PaymentEntity.builder()
                .amount(new BigDecimal("1000"))
                .method(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.INITIATED)
                .build();
        payment.setId(paymentId);
        order.setPayment(payment);

        when(paymentRepository.findByExternalTransactionId("123")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderCode(orderCode)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(paymentRepository.save(payment)).thenReturn(payment);

        Map<String, Object> response = sePayService.processWebhook("Apikey secret", webhook(orderCode, "123", new BigDecimal("500")));

        assertFalse((Boolean) response.get("success"));
        assertEquals("Partial payment", response.get("message"));
        assertEquals(PaymentStatus.PARTIAL, payment.getStatus());
        assertEquals(OrderStatus.PENDING_PAYMENT, order.getStatus());
        verify(orderStatusTransitionService).markPartialPayment(order);
        verify(orderRepository).save(order);
        verify(paymentRepository).save(payment);
    }

    @Test
    void processWebhookShouldKeepCompletedPaymentOrderPendingForManualConfirmation() {
        String orderCode = "ORD260514ABCD1234";
        UUID paymentId = UUID.randomUUID();

        OrderEntity order = OrderEntity.builder()
                .orderCode(orderCode)
                .status(OrderStatus.PENDING_PAYMENT)
                .finalAmount(new BigDecimal("1000"))
                .build();
        PaymentEntity payment = PaymentEntity.builder()
                .amount(new BigDecimal("1000"))
                .method(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.INITIATED)
                .build();
        payment.setId(paymentId);
        order.setPayment(payment);

        when(paymentRepository.findByExternalTransactionId("123")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderCode(orderCode)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(paymentRepository.save(payment)).thenReturn(payment);

        Map<String, Object> response = sePayService.processWebhook("Apikey secret", webhook(orderCode, "123", new BigDecimal("1000")));

        assertTrue((Boolean) response.get("success"));
        assertEquals("Payment processed successfully", response.get("message"));
        assertEquals(PaymentStatus.COMPLETED, payment.getStatus());
        assertEquals("123", payment.getExternalTransactionId());
        assertEquals(OrderStatus.PENDING, order.getStatus());
        verify(orderStatusTransitionService).markPaymentSuccess(order);
        verify(orderRepository).save(order);
        verify(paymentRepository).save(payment);
    }

    private SePayWebhookRequest webhook(String orderCode, String id, BigDecimal amount) {
        SePayWebhookRequest request = new SePayWebhookRequest();
        request.setCode(orderCode);
        request.setId(Long.valueOf(id));
        request.setTransferType("in");
        request.setTransferAmount(amount);
        return request;
    }
}
