package com.nchuy099.SmartPharma.order.application.command;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReferenceType;
import com.nchuy099.SmartPharma.inventory.model.ReservationAllocation;
import com.nchuy099.SmartPharma.inventory.service.InventoryCommandService;
import com.nchuy099.SmartPharma.order.domain.repository.OrderItemInventoryAllocationRepository;
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
    private final InventoryCommandService inventoryCommandService;
    private final OrderItemInventoryAllocationRepository orderItemInventoryAllocationRepository;
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
        order.getItems().forEach(item -> {
            List<ReservationAllocation> allocations = orderItemInventoryAllocationRepository.findByOrderItemId(item.getId())
                    .stream()
                    .map(allocation -> new ReservationAllocation(
                            allocation.getLot().getId(),
                            allocation.getRemainingReservedQuantity(),
                            allocation.getLot().getUnitCost()))
                    .filter(allocation -> allocation.quantity() > 0)
                    .toList();
            if (allocations.isEmpty()) {
                throw new AppException(ErrorCode.CONFLICT, "Order item has no reserved inventory allocation");
            }
            inventoryCommandService.exportAllocations(
                    item.getVariant().getId(),
                    allocations,
                    InventoryReferenceType.ORDER,
                    order.getId().toString(),
                    null);
            orderItemInventoryAllocationRepository.findByOrderItemId(item.getId())
                    .forEach(allocation -> allocation.markExported(allocation.getRemainingReservedQuantity()));
        });
        order.setStockExported(true);
        orderRepository.save(order);
        orderEventPublisher.publishShipped(order);
        return orderMapper.toOrderResponse(order);
    }
}
