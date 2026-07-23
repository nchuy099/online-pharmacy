package com.nchuy099.SmartPharma.order.application.cancel;

import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentMethod;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class PendingConfirmationAutoCancelJob {

    static final String AUTO_CANCEL_REASON = "Auto-cancelled after pending confirmation timeout";

    private final OrderRepository orderRepository;
    private final OrderCancellationService orderCancellationService;

    @Value("${order.cod-confirmation-timeout-seconds:86400}")
    private long codConfirmationTimeoutSeconds;

    @Scheduled(fixedDelayString = "${order.auto-cancel.pending-confirmation-scan-ms:60000}")
    @Transactional
    public void cancelExpiredPendingConfirmations() {
        Instant cutoff = Instant.now().minusSeconds(codConfirmationTimeoutSeconds);
        List<UUID> expiredOrderIds = orderRepository.findIdsByStatusAndCreatedAtBefore(
                OrderStatus.PENDING_CONFIRMATION,
                cutoff);
        for (UUID orderId : expiredOrderIds) {
            try {
                cancelExpiredPendingConfirmation(orderId, cutoff);
            } catch (RuntimeException ex) {
                log.warn("Failed to auto-cancel expired pending confirmation order {}", orderId, ex);
            }
        }
    }

    @Transactional
    public void cancelExpiredPendingConfirmation(UUID orderId, Instant cutoff) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.PENDING_CONFIRMATION) {
            return;
        }
        if (order.getCreatedAt() == null || order.getCreatedAt().isAfter(cutoff)) {
            return;
        }
        if (order.getPayment() == null || order.getPayment().getMethod() != PaymentMethod.COD) {
            return;
        }

        orderCancellationService.cancel(order, AUTO_CANCEL_REASON);
    }
}
