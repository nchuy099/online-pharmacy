package com.nchuy099.SmartPharma.order.application.command;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.service.InventoryDomainService;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.infrastructure.event.OrderEventPublisher;
import com.nchuy099.SmartPharma.order.infrastructure.shipping.ShippingProvider;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShipOrderUseCase {

    private final OrderRepository orderRepository;
    private final OrderStatusPolicy orderStatusPolicy;
    private final ShippingProvider shippingProvider;
    private final InventoryDomainService inventoryDomainService;
    private final OrderMapper orderMapper;
    private final OrderEventPublisher orderEventPublisher;

    @Transactional
    public OrderResponse ship(UUID orderId) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));

        orderStatusPolicy.ensureCanShip(order);
        String ghnOrderCode = shippingProvider.createShipment(order, order.getGhnDistrictId(), order.getGhnWardCode(),
                order.getShippingAddress(), order.getShippingFullName(), order.getShippingPhone(),
                order.getProvinceName(), order.getDistrictName(), order.getWardName());

        order.setGhnOrderCode(ghnOrderCode);
        orderStatusPolicy.ship(order);
        inventoryDomainService.exportOrder(order);
        orderRepository.save(order);
        orderEventPublisher.publishShipped(order);
        return orderMapper.toOrderResponse(order);
    }
}
