package com.nchuy099.SmartPharma.order.application.cancel;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.flashsale.service.FlashSaleService;
import com.nchuy099.SmartPharma.inventory.service.InventoryDomainService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
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
    private final InventoryDomainService inventoryDomainService;
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
            var inventory = inventoryDomainService.getInventory(item.getVariant().getId().toString());
            inventoryDomainService.release(inventory, item.getQuantity());
        });

        if (order.getFlashSaleReservationId() != null) {
            flashSaleService.releaseReservation(order.getFlashSaleReservationId(), userId);
        }

        orderRepository.save(order);
        orderEventPublisher.publishCancelled(order);
    }
}
