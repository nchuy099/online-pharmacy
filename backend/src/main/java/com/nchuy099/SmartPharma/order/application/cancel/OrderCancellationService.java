package com.nchuy099.SmartPharma.order.application.cancel;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReferenceType;
import com.nchuy099.SmartPharma.inventory.model.ReservationAllocation;
import com.nchuy099.SmartPharma.inventory.service.InventoryCommandService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderItemInventoryAllocationRepository;
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
    private final InventoryCommandService inventoryCommandService;
    private final OrderItemInventoryAllocationRepository orderItemInventoryAllocationRepository;
    private final FlashSaleService flashSaleService;
    private final OrderRepository orderRepository;
    private final OrderEventPublisher orderEventPublisher;

    @Transactional
    public void cancel(OrderEntity order, String reason) {
        orderStatusPolicy.cancel(order);
        order.setCancelReason(reason);

        order.getItems().forEach(item -> {
            List<ReservationAllocation> allocations = orderItemInventoryAllocationRepository.findByOrderItemId(item.getId())
                    .stream()
                    .map(allocation -> new ReservationAllocation(
                            allocation.getLot().getId(),
                            allocation.getRemainingReservedQuantity(),
                            allocation.getLot().getUnitCost()))
                    .filter(allocation -> allocation.quantity() > 0)
                    .toList();
            if (!allocations.isEmpty()) {
                inventoryCommandService.releaseAllocations(
                        item.getVariant().getId(),
                        allocations,
                        InventoryReferenceType.ORDER,
                        order.getId().toString(),
                        order.getUser().getId());
            }
        });

        if (order.getFlashSaleReservationId() != null) {
            flashSaleService.releaseReservation(order.getFlashSaleReservationId(), order.getUser().getId());
        }

        PaymentEntity payment = order.getPayment();
        if (payment != null && payment.getStatus() != PaymentStatus.COMPLETED && payment.getStatus() != PaymentStatus.REFUNDED) {
            payment.setStatus(PaymentStatus.CANCELLED);
        }

        orderRepository.save(order);
        orderEventPublisher.publishCancelled(order);
    }
}
