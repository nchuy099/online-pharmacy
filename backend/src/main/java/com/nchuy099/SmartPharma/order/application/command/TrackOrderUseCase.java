package com.nchuy099.SmartPharma.order.application.command;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.infrastructure.shipping.ShippingProvider;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TrackOrderUseCase {

    private final OrderRepository orderRepository;
    private final ShippingProvider shippingProvider;
    private final OrderStatusPolicy orderStatusPolicy;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse track(String ghnOrderCode) {
        var order = orderRepository.findByGhnOrderCode(ghnOrderCode)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found with GHN code: " + ghnOrderCode));
        var ghnDetail = shippingProvider.getShipmentDetails(ghnOrderCode);
        if (ghnDetail != null && ghnDetail.getStatus() != null) {
            orderStatusPolicy.syncFromGhn(order, ghnDetail.getStatus());
            orderRepository.save(order);
        }
        return orderMapper.toOrderResponseWithLogs(order, ghnDetail);
    }
}
