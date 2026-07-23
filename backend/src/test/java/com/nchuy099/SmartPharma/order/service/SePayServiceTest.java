package com.nchuy099.SmartPharma.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderEventPublisher;
import com.nchuy099.SmartPharma.inventory.service.InventoryReservationService;
import com.nchuy099.SmartPharma.payment.application.webhook.ProcessSePayWebhookUseCase;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;
import com.nchuy099.SmartPharma.payment.dto.request.SePayWebhookRequest;
import com.nchuy099.SmartPharma.payment.repository.PaymentRepository;

class SePayServiceTest {

    private OrderRepository orderRepository;
    private PaymentRepository paymentRepository;
    private OrderStatusPolicy orderStatusPolicy;
    private InventoryReservationService inventoryReservationService;
    private OrderEventPublisher orderEventPublisher;
    private ProcessSePayWebhookUseCase processSePayWebhookUseCase;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        orderStatusPolicy = new OrderStatusPolicy();
        inventoryReservationService = mock(InventoryReservationService.class);
        orderEventPublisher = mock(OrderEventPublisher.class);

        processSePayWebhookUseCase = new ProcessSePayWebhookUseCase(orderRepository, paymentRepository,
                orderStatusPolicy, inventoryReservationService, orderEventPublisher);
        ReflectionTestUtils.setField(processSePayWebhookUseCase, "sepayApiKey", "secret");
        ReflectionTestUtils.setField(processSePayWebhookUseCase, "accountNumber", "0123499999");
        ReflectionTestUtils.setField(processSePayWebhookUseCase, "bankName", "MBBank");
    }

    @Test
    void processWebhookShouldPersistPartialPaymentTransition() {
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
                .status(PaymentStatus.PENDING)
                .build();
        payment.setId(paymentId);
        order.setPayment(payment);

        when(paymentRepository.findByExternalTransactionId("123")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderCodeForUpdate(orderCode)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(paymentRepository.save(payment)).thenReturn(payment);

        Map<String, Object> response = processSePayWebhookUseCase.processWebhook("Apikey secret",
                webhook(orderCode, "123", new BigDecimal("500")));

        assertFalse((Boolean) response.get("success"));
        assertEquals("Partial payment", response.get("message"));
        assertEquals(PaymentStatus.PARTIAL, payment.getStatus());
        assertEquals(OrderStatus.PENDING_PAYMENT, order.getStatus());
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
                .status(PaymentStatus.PENDING)
                .build();
        payment.setId(paymentId);
        order.setPayment(payment);

        when(paymentRepository.findByExternalTransactionId("123")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderCodeForUpdate(orderCode)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(paymentRepository.save(payment)).thenReturn(payment);

        Map<String, Object> response = processSePayWebhookUseCase.processWebhook("Apikey secret",
                webhook(orderCode, "123", new BigDecimal("1000")));

        assertTrue((Boolean) response.get("success"));
        assertEquals("Payment processed successfully", response.get("message"));
        assertEquals(PaymentStatus.COMPLETED, payment.getStatus());
        assertEquals("123", payment.getExternalTransactionId());
        assertEquals(OrderStatus.PENDING_CONFIRMATION, order.getStatus());
        verify(inventoryReservationService).clearOrderReservationExpiry(order);
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
