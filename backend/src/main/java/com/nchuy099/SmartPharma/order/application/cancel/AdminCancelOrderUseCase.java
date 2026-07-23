package com.nchuy099.SmartPharma.order.application.cancel;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.request.OrderCancelRequest;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminCancelOrderUseCase {

    private final OrderRepository orderRepository;
    private final OrderCancellationService orderCancellationService;

    @Transactional
    public void cancel(UUID orderId, OrderCancelRequest request) {
        log.info("Processing admin cancel order request with id: {}", orderId);
        var order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));
        orderCancellationService.cancel(order, request != null ? request.getReason() : null);
    }
}
