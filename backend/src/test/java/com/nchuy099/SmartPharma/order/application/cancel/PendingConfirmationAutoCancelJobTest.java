package com.nchuy099.SmartPharma.order.application.cancel;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PendingConfirmationAutoCancelJobTest {

    @Test
    void cancelsExpiredCodPendingConfirmation() throws Exception {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderCancellationService cancellationService = mock(OrderCancellationService.class);
        PendingConfirmationAutoCancelJob job = new PendingConfirmationAutoCancelJob(orderRepository, cancellationService);
        UUID orderId = UUID.randomUUID();
        Instant cutoff = Instant.now();
        OrderEntity order = order(PaymentMethod.COD, cutoff.minusSeconds(1));

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));

        job.cancelExpiredPendingConfirmation(orderId, cutoff);

        verify(cancellationService).cancel(order, PendingConfirmationAutoCancelJob.AUTO_CANCEL_REASON);
    }

    @Test
    void skipsBankTransferPendingConfirmation() throws Exception {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderCancellationService cancellationService = mock(OrderCancellationService.class);
        PendingConfirmationAutoCancelJob job = new PendingConfirmationAutoCancelJob(orderRepository, cancellationService);
        UUID orderId = UUID.randomUUID();
        Instant cutoff = Instant.now();
        OrderEntity order = order(PaymentMethod.BANK_TRANSFER, cutoff.minusSeconds(1));

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));

        job.cancelExpiredPendingConfirmation(orderId, cutoff);

        verify(cancellationService, never()).cancel(order, PendingConfirmationAutoCancelJob.AUTO_CANCEL_REASON);
    }

    @Test
    void scansExpiredPendingConfirmationIds() throws Exception {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderCancellationService cancellationService = mock(OrderCancellationService.class);
        PendingConfirmationAutoCancelJob job = new PendingConfirmationAutoCancelJob(orderRepository, cancellationService);
        setTimeout(job, 86400L);
        UUID orderId = UUID.randomUUID();
        OrderEntity order = order(PaymentMethod.COD, Instant.now().minusSeconds(86401));

        when(orderRepository.findIdsByStatusAndCreatedAtBefore(
                org.mockito.ArgumentMatchers.eq(OrderStatus.PENDING_CONFIRMATION),
                org.mockito.ArgumentMatchers.any(Instant.class)))
                .thenReturn(List.of(orderId));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));

        job.cancelExpiredPendingConfirmations();

        verify(cancellationService).cancel(order, PendingConfirmationAutoCancelJob.AUTO_CANCEL_REASON);
    }

    private static OrderEntity order(PaymentMethod method, Instant createdAt) throws Exception {
        OrderEntity order = OrderEntity.builder().status(OrderStatus.PENDING_CONFIRMATION).build();
        PaymentEntity payment = PaymentEntity.builder().method(method).build();
        order.setPayment(payment);
        setField(order, "createdAt", createdAt);
        return order;
    }

    private static void setTimeout(PendingConfirmationAutoCancelJob job, long seconds) throws Exception {
        Field field = PendingConfirmationAutoCancelJob.class.getDeclaredField("codConfirmationTimeoutSeconds");
        field.setAccessible(true);
        field.set(job, seconds);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getSuperclass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
