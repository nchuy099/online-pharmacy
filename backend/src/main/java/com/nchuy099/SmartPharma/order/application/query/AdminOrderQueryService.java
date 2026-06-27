package com.nchuy099.SmartPharma.order.application.query;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.response.OrderPageResponse;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.infrastructure.shipping.ShippingProvider;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminOrderQueryService {

    private final OrderRepository orderRepository;
    private final ShippingProvider shippingProvider;
    private final OrderStatusPolicy orderStatusPolicy;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse getDetails(UUID orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));
        var ghnDetail = shippingProvider.getShipmentDetails(order.getGhnOrderCode());
        if (ghnDetail != null && ghnDetail.getStatus() != null) {
            orderStatusPolicy.syncFromGhn(order, ghnDetail.getStatus());
            orderRepository.save(order);
        }
        return orderMapper.toOrderResponseWithLogs(order, ghnDetail);
    }

    @Transactional
    public OrderPageResponse getOrderList(int page, int size, String search, String status) {
        if (page > 0) {
            page--;
        }
        Pageable pageable = PageRequest.of(page, size);
        String normalizedSearch = search == null ? null : search.trim();
        if (normalizedSearch != null && normalizedSearch.isEmpty()) {
            normalizedSearch = null;
        }

        Page<UUID> orderIdsPage = orderRepository.findAdminOrderIds(normalizedSearch, parseAdminOrderStatus(status),
                pageable);
        if (orderIdsPage.isEmpty()) {
            return OrderPageResponse.builder()
                    .orders(List.of())
                    .pagination(Pagination.builder()
                            .page(page + 1)
                            .size(size)
                            .totalPages(orderIdsPage.getTotalPages())
                            .totalElements(orderIdsPage.getTotalElements())
                            .build())
                    .build();
        }

        List<OrderEntity> ordersWithDetails = orderRepository.findAllWithItemsAndPayment(orderIdsPage.getContent());
        Map<UUID, OrderEntity> orderMap = ordersWithDetails.stream()
                .collect(Collectors.toMap(OrderEntity::getId, java.util.function.Function.identity()));

        for (OrderEntity order : ordersWithDetails) {
            syncOrderStatusFromGhn(order);
        }

        return OrderPageResponse.builder()
                .orders(orderIdsPage.getContent().stream()
                        .map(orderMap::get)
                        .filter(java.util.Objects::nonNull)
                        .map(orderMapper::toOrderResponse)
                        .toList())
                .pagination(Pagination.builder()
                        .page(page + 1)
                        .size(size)
                        .totalPages(orderIdsPage.getTotalPages())
                        .totalElements(orderIdsPage.getTotalElements())
                        .build())
                .build();
    }

    private void syncOrderStatusFromGhn(OrderEntity order) {
        if (order == null) {
            return;
        }
        String ghnOrderCode = order.getGhnOrderCode();
        if (ghnOrderCode == null || ghnOrderCode.isBlank()) {
            return;
        }
        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }
        var ghnDetail = shippingProvider.getShipmentDetails(ghnOrderCode);
        if (ghnDetail != null && ghnDetail.getStatus() != null) {
            orderStatusPolicy.syncFromGhn(order, ghnDetail.getStatus());
            orderRepository.save(order);
        }
    }

    private OrderStatus parseAdminOrderStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            log.warn("Ignoring invalid admin order status filter: {}", status);
            return null;
        }
    }
}
