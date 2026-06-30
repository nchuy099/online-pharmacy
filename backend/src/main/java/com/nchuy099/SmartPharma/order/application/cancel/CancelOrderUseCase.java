package com.nchuy099.SmartPharma.order.application.cancel;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReferenceType;
import com.nchuy099.SmartPharma.inventory.model.ReservationAllocation;
import com.nchuy099.SmartPharma.inventory.service.InventoryCommandService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderItemInventoryAllocationRepository;
import com.nchuy099.SmartPharma.order.domain.policy.OrderCancelPolicy;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.request.OrderCancelRequest;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderEventPublisher;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CancelOrderUseCase {

    private final SecurityUtils securityUtils;
    private final OrderRepository orderRepository;
    private final OrderCancelPolicy orderCancelPolicy;
    private final OrderStatusPolicy orderStatusPolicy;
    private final InventoryCommandService inventoryCommandService;
    private final OrderItemInventoryAllocationRepository orderItemInventoryAllocationRepository;
    private final FlashSaleService flashSaleService;
    private final OrderEventPublisher orderEventPublisher;

    @Transactional
    public void cancel(UUID orderId, OrderCancelRequest request) {
        log.info("Processing cancel order request with id: {}", orderId);
        UUID userId = securityUtils.getCurrentUserId();
        OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));

        orderCancelPolicy.validate(order);
        orderStatusPolicy.cancel(order);
        order.setCancelReason(request.getReason());

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
                        userId);
            }
        });

        if (order.getFlashSaleReservationId() != null) {
            flashSaleService.releaseReservation(order.getFlashSaleReservationId(), userId);
        }

        orderRepository.save(order);
        orderEventPublisher.publishCancelled(order);
    }
}
