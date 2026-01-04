package com.nchuy099.SmartPharma.consultation.service;

import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.order.dto.OrderMapper;
import com.nchuy099.SmartPharma.order.dto.response.OrderResponse;
import com.nchuy099.SmartPharma.consultation.dto.request.PrescriptionRequest;
import com.nchuy099.SmartPharma.consultation.dto.response.PatientHistoryResponse;
import com.nchuy099.SmartPharma.consultation.dto.response.PrescriptionResponse;
import com.nchuy099.SmartPharma.consultation.entity.PrescriptionEntity;
import com.nchuy099.SmartPharma.consultation.entity.PrescriptionItemEntity;
import com.nchuy099.SmartPharma.consultation.repository.PrescriptionRepository;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.product.repository.ProductRepository;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ConsultationService {

    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final SecurityUtils securityUtils;
    private final ChatConversationRepository chatConversationRepository;

    @Transactional
    public PrescriptionResponse createPrescription(PrescriptionRequest req) {
        log.info("Creating new prescription for customer: {}", req.getCustomerId());
        
        UUID pharmacistId = securityUtils.getCurrentUserId();
        UserEntity pharmacist = userRepository.findById(pharmacistId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Pharmacist not found"));

        UserEntity customer = userRepository.findById(UUID.fromString(req.getCustomerId()))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Customer not found"));

        ChatConversationEntity chatConversation = null;
        if (req.getChatConversationId() != null && !req.getChatConversationId().isBlank()) {
            chatConversation = chatConversationRepository.findById(UUID.fromString(req.getChatConversationId()))
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Chat conversation not found"));
        }

        PrescriptionEntity prescription = PrescriptionEntity.builder()
                .customer(customer)
                .pharmacist(pharmacist)
                .chatConversation(chatConversation)
                .diagnosis(req.getDiagnosis())
                .generalInstructions(req.getGeneralInstructions())
                .followUpDate(req.getFollowUpDate())
                .build();

        for (var itemReq : req.getItems()) {
            ProductEntity product = productRepository.findById(UUID.fromString(itemReq.getProductId()))
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found: " + itemReq.getProductId()));
            
            PrescriptionItemEntity item = PrescriptionItemEntity.builder()
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .instructions(itemReq.getInstructions())
                    .build();
            
            prescription.addItem(item);
        }

        PrescriptionEntity saved = prescriptionRepository.save(prescription);
        return mapToResponse(saved);
    }

    public Page<PrescriptionResponse> getCustomerPrescriptions(UUID customerId, int page, int size) {
        if (page > 0) page--;
        Pageable pageable = PageRequest.of(page, size);
        return prescriptionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::mapToResponse);
    }

    public Page<PrescriptionResponse> getMyPrescriptions(int page, int size) {
        UUID customerId = securityUtils.getCurrentUserId();
        log.info("Fetching prescriptions for current customer: {}", customerId);
        if (page > 0) page--;
        Pageable pageable = PageRequest.of(page, size);
        return prescriptionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::mapToResponse);
    }

    public PatientHistoryResponse getPatientHistory(UUID customerId, int orderPage, int orderSize, int rxPage, int rxSize) {
        log.info("Fetching patient history for customer: {}", customerId);
        
        UserEntity customer = userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Customer not found"));

        if (orderPage > 0) orderPage--;
        if (rxPage > 0) rxPage--;

        // 1. Fetch Orders
        Pageable orderPageable = PageRequest.of(orderPage, orderSize, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt", "id"));
        Page<OrderEntity> orderPageResult = orderRepository.findByUserId(customerId, orderPageable);
        java.util.List<UUID> orderIds = orderPageResult.getContent().stream().map(OrderEntity::getId).toList();
        java.util.List<OrderEntity> ordersWithDetails = orderRepository.findAllWithItemsAndPayment(orderIds);
        java.util.Map<UUID, OrderEntity> orderMap = ordersWithDetails.stream()
                .collect(Collectors.toMap(OrderEntity::getId, java.util.function.Function.identity()));

        java.util.List<OrderResponse> orderResponses = orderIds.stream()
                .map(orderMap::get)
                .map(orderMapper::toOrderResponse)
                .toList();

        // 2. Fetch Prescriptions
        Pageable rxPageable = PageRequest.of(rxPage, rxSize);
        Page<PrescriptionEntity> rxPageResult = prescriptionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, rxPageable);

        return PatientHistoryResponse.builder()
                .customerId(customer.getId().toString())
                .customerName(customer.getFullName())
                .age(calculateAge(customer.getDateOfBirth()))
                .gender(customer.getGender())
                .allergies("Không rõ") // Hardcoded or fetch from medical profile if exists
                .recentOrders(orderResponses)
                .ordersPagination(Pagination.builder()
                        .page(orderPage + 1)
                        .size(orderSize)
                        .totalElements(orderPageResult.getTotalElements())
                        .totalPages(orderPageResult.getTotalPages())
                        .build())
                .prescriptions(rxPageResult.getContent().stream().map(this::mapToResponse).toList())
                .prescriptionsPagination(Pagination.builder()
                        .page(rxPage + 1)
                        .size(rxSize)
                        .totalElements(rxPageResult.getTotalElements())
                        .totalPages(rxPageResult.getTotalPages())
                        .build())
                .build();
    }

    private PrescriptionResponse mapToResponse(PrescriptionEntity entity) {
        return PrescriptionResponse.builder()
                .id(entity.getId())
                .customerId(entity.getCustomer().getId().toString())
                .customerName(entity.getCustomer().getFullName())
                .pharmacistId(entity.getPharmacist().getId().toString())
                .pharmacistName(entity.getPharmacist().getFullName())
                .diagnosis(entity.getDiagnosis())
                .generalInstructions(entity.getGeneralInstructions())
                .followUpDate(entity.getFollowUpDate())
                .createdAt(entity.getCreatedAt())
                .items(entity.getItems().stream().map(item -> 
                    PrescriptionResponse.PrescriptionItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId().toString())
                        .productName(item.getProduct().getName())
                        .productWebName(item.getProduct().getWebName())
                        .productImageUrl(getProductImageUrl(item.getProduct()))
                        .quantity(item.getQuantity())
                        .instructions(item.getInstructions())
                        .build()
                ).collect(Collectors.toList()))
                .build();
    }

    private String getProductImageUrl(ProductEntity product) {
        return product.getPrimaryImage();
    }

    private Integer calculateAge(java.time.LocalDate dob) {
        if (dob == null) return null;
        return java.time.Period.between(dob, java.time.LocalDate.now()).getYears();
    }
}
