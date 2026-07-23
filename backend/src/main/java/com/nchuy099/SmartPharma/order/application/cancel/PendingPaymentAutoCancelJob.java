package com.nchuy099.SmartPharma.order.application.cancel;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class PendingPaymentAutoCancelJob {

    static final String AUTO_CANCEL_REASON = "Auto-cancelled after 10 minutes without full payment";

    private final OrderRepository orderRepository;
    private final OrderCancellationService orderCancellationService;

    @Value("${order.auto-cancel.pending-payment-timeout-seconds:600}")
    private long pendingPaymentTimeoutSeconds;

    @Scheduled(fixedDelayString = "${order.auto-cancel.pending-payment-scan-ms:60000}")
    @Transactional
    public void cancelExpiredPendingPayments() {
        Instant cutoff = Instant.now().minusSeconds(pendingPaymentTimeoutSeconds);
        List<UUID> expiredOrderIds = orderRepository.findIdsByStatusAndCreatedAtBefore(OrderStatus.PENDING_PAYMENT, cutoff);
        for (UUID orderId : expiredOrderIds) {
            try {
                cancelExpiredPendingPayment(orderId, cutoff);
            } catch (RuntimeException ex) {
                log.warn("Failed to auto-cancel expired pending payment order {}", orderId, ex);
            }
        }
    }

    @Transactional
    public void cancelExpiredPendingPayment(UUID orderId, Instant cutoff) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            return;
        }
        if (order.getCreatedAt() == null || order.getCreatedAt().isAfter(cutoff)) {
            return;
        }

        PaymentEntity payment = order.getPayment();
        if (payment != null && payment.getStatus() == PaymentStatus.COMPLETED) {
            return;
        }

        orderCancellationService.cancel(order, AUTO_CANCEL_REASON);
    }
}
