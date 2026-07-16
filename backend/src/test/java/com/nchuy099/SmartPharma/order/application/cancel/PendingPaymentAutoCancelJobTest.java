package com.nchuy099.SmartPharma.order.application.cancel;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;

class PendingPaymentAutoCancelJobTest {

    @Test
    void cancelsExpiredPendingPaymentOrderWhenStillUnpaid() throws Exception {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderCancellationService cancellationService = mock(OrderCancellationService.class);
        PendingPaymentAutoCancelJob job = new PendingPaymentAutoCancelJob(orderRepository, cancellationService);
        setTimeout(job, 600L);

        UUID orderId = UUID.randomUUID();
        Instant cutoff = Instant.now();
        OrderEntity order = order(OrderStatus.PENDING_PAYMENT, cutoff.minusSeconds(1), PaymentStatus.INITIATED);

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));

        job.cancelExpiredPendingPayment(orderId, cutoff);

        verify(cancellationService).cancel(order, PendingPaymentAutoCancelJob.AUTO_CANCEL_REASON);
    }

    @Test
    void skipsOrderWhenPaymentAlreadyCompleted() throws Exception {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderCancellationService cancellationService = mock(OrderCancellationService.class);
        PendingPaymentAutoCancelJob job = new PendingPaymentAutoCancelJob(orderRepository, cancellationService);
        setTimeout(job, 600L);

        UUID orderId = UUID.randomUUID();
        Instant cutoff = Instant.now();
        OrderEntity order = order(OrderStatus.PENDING_PAYMENT, cutoff.minusSeconds(1), PaymentStatus.COMPLETED);

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));

        job.cancelExpiredPendingPayment(orderId, cutoff);

        verify(cancellationService, never()).cancel(order, PendingPaymentAutoCancelJob.AUTO_CANCEL_REASON);
    }

    @Test
    void scansExpiredPendingPaymentIdsUsingConfiguredTimeout() throws Exception {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderCancellationService cancellationService = mock(OrderCancellationService.class);
        PendingPaymentAutoCancelJob job = new PendingPaymentAutoCancelJob(orderRepository, cancellationService);
        setTimeout(job, 600L);

        UUID orderId = UUID.randomUUID();
        OrderEntity order = order(OrderStatus.PENDING_PAYMENT, Instant.now().minusSeconds(601), PaymentStatus.PARTIAL);

        when(orderRepository.findIdsByStatusAndCreatedAtBefore(org.mockito.ArgumentMatchers.eq(OrderStatus.PENDING_PAYMENT),
                org.mockito.ArgumentMatchers.any(Instant.class)))
                .thenReturn(List.of(orderId));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));

        job.cancelExpiredPendingPayments();

        verify(orderRepository).findIdsByStatusAndCreatedAtBefore(
                org.mockito.ArgumentMatchers.eq(OrderStatus.PENDING_PAYMENT),
                org.mockito.ArgumentMatchers.any(Instant.class));
        verify(cancellationService).cancel(order, PendingPaymentAutoCancelJob.AUTO_CANCEL_REASON);
    }

    private static OrderEntity order(OrderStatus status, Instant createdAt, PaymentStatus paymentStatus) throws Exception {
        OrderEntity order = OrderEntity.builder().status(status).build();
        PaymentEntity payment = PaymentEntity.builder().status(paymentStatus).build();
        order.setPayment(payment);
        setField(order, "createdAt", createdAt);
        return order;
    }

    private static void setTimeout(PendingPaymentAutoCancelJob job, long seconds) throws Exception {
        Field field = PendingPaymentAutoCancelJob.class.getDeclaredField("pendingPaymentTimeoutSeconds");
        field.setAccessible(true);
        field.set(job, seconds);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getSuperclass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
