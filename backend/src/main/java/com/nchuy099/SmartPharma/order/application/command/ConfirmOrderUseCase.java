package com.nchuy099.SmartPharma.order.application.command;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConfirmOrderUseCase {

    private final OrderRepository orderRepository;
    private final OrderStatusPolicy orderStatusPolicy;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse confirm(UUID orderId) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));
        orderStatusPolicy.confirm(order);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order);
    }
}
