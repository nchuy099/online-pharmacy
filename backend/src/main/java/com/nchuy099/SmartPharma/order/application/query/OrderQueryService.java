package com.nchuy099.SmartPharma.order.application.query;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
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
public class OrderQueryService {

    private final SecurityUtils securityUtils;
    private final OrderRepository orderRepository;
    private final ShippingProvider shippingProvider;
    private final OrderStatusPolicy orderStatusPolicy;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse getDetails(UUID orderId) {
        UUID userId = securityUtils.getCurrentUserId();
        var order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order information missing"));
        var ghnDetail = shippingProvider.getShipmentDetails(order.getGhnOrderCode());
        if (ghnDetail != null && ghnDetail.getStatus() != null) {
            orderStatusPolicy.syncFromGhn(order, ghnDetail.getStatus());
            orderRepository.save(order);
        }
        return orderMapper.toOrderResponseWithLogs(order, ghnDetail);
    }

    public OrderPageResponse getUserOrderHistory(int page, int size) {
        UUID userId = securityUtils.getCurrentUserId();
        if (page > 0) {
            page--;
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<com.nchuy099.SmartPharma.order.domain.entity.OrderEntity> orderPage = orderRepository.findByUserId(userId,
                pageable);
        List<UUID> orderIds = orderPage.getContent().stream().map(com.nchuy099.SmartPharma.order.domain.entity.OrderEntity::getId).toList();

        if (orderIds.isEmpty()) {
            return OrderPageResponse.builder()
                    .orders(List.of())
                    .pagination(Pagination.builder()
                            .page(page + 1)
                            .size(size)
                            .totalPages(orderPage.getTotalPages())
                            .totalElements(orderPage.getTotalElements())
                            .build())
                    .build();
        }

        List<com.nchuy099.SmartPharma.order.domain.entity.OrderEntity> ordersWithDetails = orderRepository
                .findAllWithItemsAndPayment(orderIds);
        Map<UUID, com.nchuy099.SmartPharma.order.domain.entity.OrderEntity> orderMap = ordersWithDetails.stream()
                .collect(Collectors.toMap(com.nchuy099.SmartPharma.order.domain.entity.OrderEntity::getId, Function.identity()));
        Map<UUID, com.nchuy099.SmartPharma.order.domain.entity.OrderEntity> pagedOrderMap = orderPage.getContent().stream()
                .collect(Collectors.toMap(com.nchuy099.SmartPharma.order.domain.entity.OrderEntity::getId, Function.identity()));

        List<OrderResponse> orderResponses = orderIds.stream()
                .map(orderId -> orderMap.getOrDefault(orderId, pagedOrderMap.get(orderId)))
                .map(orderMapper::toOrderResponse)
                .toList();

        return OrderPageResponse.builder()
                .orders(orderResponses)
                .pagination(Pagination.builder()
                        .page(page + 1)
                        .size(size)
                        .totalPages(orderPage.getTotalPages())
                        .totalElements(orderPage.getTotalElements())
                        .build())
                .build();
    }
}
