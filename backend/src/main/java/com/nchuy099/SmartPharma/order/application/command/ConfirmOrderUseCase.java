package com.nchuy099.SmartPharma.order.application.command;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderEventPublisher;
import com.nchuy099.SmartPharma.inventory.service.InventoryReservationService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConfirmOrderUseCase {

    private final OrderRepository orderRepository;
    private final OrderStatusPolicy orderStatusPolicy;
    private final InventoryReservationService inventoryReservationService;
    private final OrderMapper orderMapper;
    private final OrderEventPublisher orderEventPublisher;

    @Transactional
    public OrderResponse confirm(UUID orderId) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));
        orderStatusPolicy.confirm(order);
        inventoryReservationService.clearOrderReservationExpiry(order);
        orderRepository.save(order);
        orderEventPublisher.publishConfirmed(order);
        return orderMapper.toOrderResponse(order);
    }
}
