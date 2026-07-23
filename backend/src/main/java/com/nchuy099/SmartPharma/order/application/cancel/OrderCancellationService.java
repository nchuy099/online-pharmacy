package com.nchuy099.SmartPharma.order.application.cancel;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.inventory.service.InventoryReservationService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderEventPublisher;
import com.nchuy099.SmartPharma.payment.domain.entity.PaymentEntity;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderCancellationService {

    private final OrderStatusPolicy orderStatusPolicy;
    private final InventoryReservationService inventoryReservationService;
    private final FlashSaleService flashSaleService;
    private final OrderRepository orderRepository;
    private final OrderEventPublisher orderEventPublisher;

    @Transactional
    public void cancel(OrderEntity order, String reason) {
        orderStatusPolicy.cancel(order);
        order.setCancelReason(reason);

        inventoryReservationService.releaseOrderReservation(order, order.getUser().getId());

        if (order.getFlashSaleReservationId() != null) {
            flashSaleService.releaseReservation(order.getFlashSaleReservationId(), order.getUser().getId());
        }

        PaymentEntity payment = order.getPayment();
        if (payment != null && (payment.getStatus() == PaymentStatus.COMPLETED || payment.getStatus() == PaymentStatus.PARTIAL)) {
            payment.setStatus(PaymentStatus.REFUND_PENDING);
        } else if (payment != null && payment.getStatus() != PaymentStatus.REFUNDED
                && payment.getStatus() != PaymentStatus.REFUND_PENDING) {
            payment.setStatus(PaymentStatus.CANCELLED);
        }

        orderRepository.save(order);
        orderEventPublisher.publishCancelled(order);
    }
}
