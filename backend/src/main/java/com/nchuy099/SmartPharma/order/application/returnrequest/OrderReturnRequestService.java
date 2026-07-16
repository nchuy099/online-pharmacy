package com.nchuy099.SmartPharma.order.application.returnrequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.inventory.domain.enums.InventoryReferenceType;
import com.nchuy099.SmartPharma.inventory.model.ReservationAllocation;
import com.nchuy099.SmartPharma.inventory.service.InventoryCommandService;
import com.nchuy099.SmartPharma.media.domain.enums.UploadType;
import com.nchuy099.SmartPharma.media.service.MediaService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderItemInventoryAllocationEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderReturnRequestEntity;
import com.nchuy099.SmartPharma.order.domain.entity.OrderReturnRequestImageEntity;
import com.nchuy099.SmartPharma.order.domain.enums.OrderReturnRequestStatus;
import com.nchuy099.SmartPharma.order.domain.enums.OrderStatus;
import com.nchuy099.SmartPharma.order.domain.policy.OrderStatusPolicy;
import com.nchuy099.SmartPharma.order.domain.repository.OrderItemInventoryAllocationRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderReturnRequestRepository;
import com.nchuy099.SmartPharma.order.dto.mapper.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.request.CreateOrderReturnRequest;
import com.nchuy099.SmartPharma.order.dto.request.ReviewOrderReturnRequest;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.order.dto.response.OrderReturnEvidenceUploadUrlResponse;
import com.nchuy099.SmartPharma.payment.domain.enums.PaymentStatus;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderReturnRequestService {

    private static final long RETURN_WINDOW_SECONDS = 7L * 24 * 60 * 60;
    private static final int MAX_EVIDENCE_IMAGES = 5;

    private final SecurityUtils securityUtils;
    private final OrderRepository orderRepository;
    private final OrderReturnRequestRepository orderReturnRequestRepository;
    private final OrderItemInventoryAllocationRepository orderItemInventoryAllocationRepository;
    private final UserRepository userRepository;
    private final OrderStatusPolicy orderStatusPolicy;
    private final InventoryCommandService inventoryCommandService;
    private final MediaService mediaService;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse create(UUID orderId, CreateOrderReturnRequest request) {
        UUID userId = securityUtils.getCurrentUserId();
        OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));
        validateReturnRequestAllowed(order);

        if (orderReturnRequestRepository.existsByOrderIdAndStatusIn(orderId,
                EnumSet.of(OrderReturnRequestStatus.PENDING, OrderReturnRequestStatus.APPROVED))) {
            throw new AppException(ErrorCode.CONFLICT, "Order already has an active return request");
        }

        OrderReturnRequestEntity returnRequest = OrderReturnRequestEntity.builder()
                .order(order)
                .requestedBy(userRepository.getReferenceById(userId))
                .reason(request.getReason().trim())
                .refundAmount(order.getItemTotalAmount() != null ? order.getItemTotalAmount() : BigDecimal.ZERO)
                .status(OrderReturnRequestStatus.PENDING)
                .build();

        normalizeEvidenceUrls(request.getImageUrls()).forEach(imageUrl -> returnRequest.addImage(
                OrderReturnRequestImageEntity.builder().imageUrl(imageUrl).build()));

        orderStatusPolicy.requestReturn(order);
        orderReturnRequestRepository.save(returnRequest);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order, returnRequest);
    }

    @Transactional
    public OrderResponse approve(UUID orderId, ReviewOrderReturnRequest request) {
        UUID reviewerId = securityUtils.getCurrentUserId();
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));
        OrderReturnRequestEntity returnRequest = orderReturnRequestRepository
                .findFirstByOrderIdAndStatusOrderByCreatedAtDescIdDesc(orderId, OrderReturnRequestStatus.PENDING)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Pending return request not found"));

        orderStatusPolicy.approveReturn(order);
        returnRequest.setStatus(OrderReturnRequestStatus.APPROVED);
        returnRequest.setReviewedBy(userRepository.getReferenceById(reviewerId));
        returnRequest.setReviewedAt(Instant.now());
        returnRequest.setReviewNote(normalizeNote(request));

        if (order.getPayment() != null
                && (order.getPayment().getStatus() == PaymentStatus.COMPLETED
                        || order.getPayment().getStatus() == PaymentStatus.PARTIAL)) {
            order.getPayment().setStatus(PaymentStatus.REFUNDED);
        }
        returnExportedInventory(order, reviewerId);

        orderReturnRequestRepository.save(returnRequest);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order, returnRequest);
    }

    @Transactional
    public OrderResponse reject(UUID orderId, ReviewOrderReturnRequest request) {
        UUID reviewerId = securityUtils.getCurrentUserId();
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));
        OrderReturnRequestEntity returnRequest = orderReturnRequestRepository
                .findFirstByOrderIdAndStatusOrderByCreatedAtDescIdDesc(orderId, OrderReturnRequestStatus.PENDING)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Pending return request not found"));

        orderStatusPolicy.rejectReturn(order);
        returnRequest.setStatus(OrderReturnRequestStatus.REJECTED);
        returnRequest.setReviewedBy(userRepository.getReferenceById(reviewerId));
        returnRequest.setReviewedAt(Instant.now());
        returnRequest.setReviewNote(normalizeNote(request));

        orderReturnRequestRepository.save(returnRequest);
        orderRepository.save(order);
        return orderMapper.toOrderResponse(order, returnRequest);
    }

    @Transactional
    public OrderReturnEvidenceUploadUrlResponse createEvidenceUploadUrl(UUID orderId) {
        UUID userId = securityUtils.getCurrentUserId();
        OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found"));
        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.RETURN_REQUESTED) {
            throw new AppException(ErrorCode.CONFLICT, "Return evidence can only be uploaded for delivered orders");
        }
        var presignedUpload = mediaService.createPreSignedUpload(
                userId.toString(),
                orderId.toString(),
                "",
                null,
                UploadType.RETURN_EVIDENCE);
        return OrderReturnEvidenceUploadUrlResponse.builder()
                .uploadUrl(presignedUpload.getUploadUrl())
                .fileUrl(presignedUpload.getFileUrl())
                .build();
    }

    private void validateReturnRequestAllowed(OrderEntity order) {
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.CONFLICT, "Only delivered orders can be returned");
        }
        if (order.getDeliveredAt() == null) {
            throw new AppException(ErrorCode.CONFLICT, "Order delivery time is missing");
        }
        if (Instant.now().isAfter(order.getDeliveredAt().plusSeconds(RETURN_WINDOW_SECONDS))) {
            throw new AppException(ErrorCode.CONFLICT, "Return request window has expired");
        }
    }

    private List<String> normalizeEvidenceUrls(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String imageUrl : imageUrls) {
            if (!StringUtils.hasText(imageUrl)) {
                continue;
            }
            normalized.add(mediaService.validateAndNormalizeImageUrl(imageUrl, UploadType.RETURN_EVIDENCE));
        }
        if (normalized.size() > MAX_EVIDENCE_IMAGES) {
            throw new AppException(ErrorCode.BAD_REQUEST, "At most 5 return evidence images are allowed");
        }
        return List.copyOf(normalized);
    }

    private String normalizeNote(ReviewOrderReturnRequest request) {
        if (request == null || !StringUtils.hasText(request.getReviewNote())) {
            return null;
        }
        return request.getReviewNote().trim();
    }

    private void returnExportedInventory(OrderEntity order, UUID reviewerId) {
        List<OrderItemInventoryAllocationEntity> allocations = orderItemInventoryAllocationRepository.findByOrderId(order.getId());
        Map<UUID, List<OrderItemInventoryAllocationEntity>> byVariant = allocations.stream()
                .filter(allocation -> allocation.getExportedQuantity() != null && allocation.getExportedQuantity() > 0)
                .collect(Collectors.groupingBy(allocation -> allocation.getOrderItem().getVariant().getId()));

        for (Map.Entry<UUID, List<OrderItemInventoryAllocationEntity>> entry : byVariant.entrySet()) {
            List<ReservationAllocation> returnedAllocations = entry.getValue().stream()
                    .map(allocation -> new ReservationAllocation(
                            allocation.getLot().getId(),
                            allocation.getExportedQuantity(),
                            allocation.getLot().getUnitCost() != null ? allocation.getLot().getUnitCost() : BigDecimal.ZERO))
                    .toList();
            if (!returnedAllocations.isEmpty()) {
                inventoryCommandService.returnAllocations(
                        entry.getKey(),
                        returnedAllocations,
                        InventoryReferenceType.ORDER,
                        order.getId().toString(),
                        reviewerId);
            }
        }
    }
}
