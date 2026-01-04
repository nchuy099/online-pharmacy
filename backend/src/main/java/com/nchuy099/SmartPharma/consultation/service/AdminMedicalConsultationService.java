package com.nchuy099.SmartPharma.consultation.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.consultation.dto.response.AdminMedicalConsultationDetailResponse;
import com.nchuy099.SmartPharma.consultation.dto.response.AdminMedicalConsultationListItemResponse;
import com.nchuy099.SmartPharma.consultation.dto.response.AdminMedicalConsultationListResponse;
import com.nchuy099.SmartPharma.consultation.dto.response.AdminMedicalConsultationStatsResponse;
import com.nchuy099.SmartPharma.consultation.dto.response.AdminMedicalConsultationTimelineEventResponse;
import com.nchuy099.SmartPharma.consultation.dto.response.PrescriptionResponse;
import com.nchuy099.SmartPharma.consultation.entity.PrescriptionEntity;
import com.nchuy099.SmartPharma.consultation.repository.PrescriptionRepository;
import com.nchuy099.SmartPharma.product.entity.ProductEntity;
import com.nchuy099.SmartPharma.user.entity.PharmacistEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminMedicalConsultationService {

    private final ChatConversationRepository chatConversationRepository;
    private final PrescriptionRepository prescriptionRepository;

    @Transactional(readOnly = true)
    public AdminMedicalConsultationListResponse getConsultations(
            int page,
            int size,
            String search,
            String status,
            String type,
            String specialty,
            Boolean assigned) {
        int resolvedPage = Math.max(1, page);
        int resolvedSize = Math.max(1, size);
        var pageable = PageRequest.of(
                resolvedPage - 1,
                resolvedSize,
                Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("createdAt")));

        var conversationsPage = chatConversationRepository.findAll(
                buildSpecification(search, status, type, specialty, assigned),
                pageable);

        return AdminMedicalConsultationListResponse.builder()
                .consultations(conversationsPage.getContent().stream()
                        .map(this::mapListItem)
                        .toList())
                .pagination(Pagination.builder()
                        .page(resolvedPage)
                        .size(resolvedSize)
                        .totalPages(conversationsPage.getTotalPages())
                        .totalElements(conversationsPage.getTotalElements())
                        .build())
                .stats(AdminMedicalConsultationStatsResponse.builder()
                        .total(chatConversationRepository.count())
                        .active(chatConversationRepository.countByStatusIgnoreCase("ACTIVE"))
                        .closed(chatConversationRepository.countByStatusIgnoreCase("CLOSED"))
                        .unassigned(chatConversationRepository.countByPharmacistIsNull())
                        .build())
                .build();
    }

    @Transactional(readOnly = true)
    public AdminMedicalConsultationDetailResponse getConsultationDetail(String id) {
        UUID consultationId = parseUuid(id, "Invalid consultation id");
        ChatConversationEntity conversation = chatConversationRepository.findById(consultationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Medical consultation not found"));

        List<PrescriptionEntity> prescriptions = prescriptionRepository
                .findByChatConversationIdOrderByCreatedAtDesc(consultationId);

        return AdminMedicalConsultationDetailResponse.builder()
                .id(conversation.getId().toString())
                .customerId(getCustomerId(conversation.getUser()))
                .customerName(getCustomerName(conversation.getUser()))
                .pharmacistId(getPharmacistUserId(conversation.getPharmacist()))
                .pharmacistName(getPharmacistName(conversation.getPharmacist()))
                .specialtyCode(getSpecialtyCode(conversation))
                .specialtyName(getSpecialtyName(conversation))
                .consultationId(normalizeBlank(conversation.getConsultationId()))
                .type(conversation.getType())
                .status(conversation.getStatus())
                .title(getConversationTitle(conversation))
                .summary(normalizeBlank(conversation.getSummary()))
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .timeline(buildTimeline(conversation, prescriptions))
                .prescriptions(prescriptions.stream().map(this::mapPrescription).toList())
                .build();
    }

    private Specification<ChatConversationEntity> buildSpecification(
            String search,
            String status,
            String type,
            String specialty,
            Boolean assigned) {
        return (root, query, cb) -> {
            query.distinct(true);

            Join<ChatConversationEntity, UserEntity> customerJoin = root.join("user", JoinType.LEFT);
            Join<ChatConversationEntity, PharmacistEntity> pharmacistJoin = root.join("pharmacist", JoinType.LEFT);
            Join<PharmacistEntity, UserEntity> pharmacistUserJoin = pharmacistJoin.join("user", JoinType.LEFT);
            Join<PharmacistEntity, CatalogEntity> specialtyJoin = pharmacistJoin.join("specialty", JoinType.LEFT);

            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            String normalizedSearch = normalizeBlank(search);
            if (normalizedSearch != null) {
                String pattern = "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(customerJoin.get("fullName"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(customerJoin.get("email"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(pharmacistUserJoin.get("fullName"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(pharmacistUserJoin.get("email"), "")), pattern)));
            }

            String normalizedStatus = normalizeBlank(status);
            if (normalizedStatus != null) {
                predicates.add(cb.equal(cb.upper(root.get("status")), normalizedStatus.toUpperCase(Locale.ROOT)));
            }

            String normalizedType = normalizeBlank(type);
            if (normalizedType != null) {
                predicates.add(cb.equal(cb.upper(root.get("type")), normalizedType.toUpperCase(Locale.ROOT)));
            }

            String normalizedSpecialty = normalizeBlank(specialty);
            if (normalizedSpecialty != null) {
                String upperSpecialty = normalizedSpecialty.toUpperCase(Locale.ROOT);
                predicates.add(cb.or(
                        cb.equal(cb.upper(cb.coalesce(root.get("consultationId"), "")), upperSpecialty),
                        cb.equal(cb.upper(cb.coalesce(specialtyJoin.get("code"), "")), upperSpecialty)));
            }

            if (assigned != null) {
                predicates.add(assigned ? cb.isNotNull(root.get("pharmacist")) : cb.isNull(root.get("pharmacist")));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private AdminMedicalConsultationListItemResponse mapListItem(ChatConversationEntity conversation) {
        return AdminMedicalConsultationListItemResponse.builder()
                .id(conversation.getId().toString())
                .customerId(getCustomerId(conversation.getUser()))
                .customerName(getCustomerName(conversation.getUser()))
                .pharmacistId(getPharmacistUserId(conversation.getPharmacist()))
                .pharmacistName(getPharmacistName(conversation.getPharmacist()))
                .specialtyCode(getSpecialtyCode(conversation))
                .specialtyName(getSpecialtyName(conversation))
                .consultationId(normalizeBlank(conversation.getConsultationId()))
                .type(conversation.getType())
                .status(conversation.getStatus())
                .title(getConversationTitle(conversation))
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private List<AdminMedicalConsultationTimelineEventResponse> buildTimeline(
            ChatConversationEntity conversation,
            List<PrescriptionEntity> prescriptions) {
        List<AdminMedicalConsultationTimelineEventResponse> timeline = new ArrayList<>();
        timeline.add(AdminMedicalConsultationTimelineEventResponse.builder()
                .type("SESSION_CREATED")
                .label("Tạo phiên tư vấn")
                .occurredAt(conversation.getCreatedAt())
                .build());

        for (PrescriptionEntity prescription : prescriptions) {
            timeline.add(AdminMedicalConsultationTimelineEventResponse.builder()
                    .type("PRESCRIPTION_CREATED")
                    .label("Kê đơn thuốc")
                    .occurredAt(prescription.getCreatedAt())
                    .build());
        }

        if ("CLOSED".equalsIgnoreCase(conversation.getStatus())) {
            timeline.add(AdminMedicalConsultationTimelineEventResponse.builder()
                    .type("SESSION_CLOSED")
                    .label("Đóng phiên tư vấn")
                    .occurredAt(conversation.getUpdatedAt())
                    .build());
        }

        return timeline.stream()
                .sorted(Comparator.comparing(AdminMedicalConsultationTimelineEventResponse::getOccurredAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private PrescriptionResponse mapPrescription(PrescriptionEntity entity) {
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
                .items(entity.getItems().stream()
                        .map(item -> PrescriptionResponse.PrescriptionItemResponse.builder()
                                .id(item.getId())
                                .productId(item.getProduct().getId().toString())
                                .productName(item.getProduct().getName())
                                .productWebName(item.getProduct().getWebName())
                                .productImageUrl(getProductImageUrl(item.getProduct()))
                                .quantity(item.getQuantity())
                                .instructions(item.getInstructions())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    private String getCustomerId(UserEntity customer) {
        return customer != null && customer.getId() != null ? customer.getId().toString() : null;
    }

    private String getCustomerName(UserEntity customer) {
        return customer != null && customer.getFullName() != null ? customer.getFullName() : "Khách vãng lai";
    }

    private String getPharmacistUserId(PharmacistEntity pharmacist) {
        if (pharmacist == null || pharmacist.getUser() == null || pharmacist.getUser().getId() == null) {
            return null;
        }
        return pharmacist.getUser().getId().toString();
    }

    private String getPharmacistName(PharmacistEntity pharmacist) {
        if (pharmacist == null || pharmacist.getUser() == null) {
            return null;
        }
        return pharmacist.getUser().getFullName();
    }

    private String getSpecialtyCode(ChatConversationEntity conversation) {
        if (conversation.getPharmacist() != null && conversation.getPharmacist().getSpecialty() != null) {
            return normalizeBlank(conversation.getPharmacist().getSpecialty().getCode());
        }
        return normalizeBlank(conversation.getConsultationId());
    }

    private String getSpecialtyName(ChatConversationEntity conversation) {
        if (conversation.getPharmacist() != null && conversation.getPharmacist().getSpecialty() != null) {
            return normalizeBlank(conversation.getPharmacist().getSpecialty().getName());
        }
        return null;
    }

    private String getConversationTitle(ChatConversationEntity conversation) {
        String title = normalizeBlank(conversation.getTitle());
        if (title != null) {
            return title;
        }
        if ("AI".equalsIgnoreCase(conversation.getType())) {
            return "AI Chatbot";
        }
        String specialtyName = getSpecialtyName(conversation);
        if (specialtyName != null) {
            return "Tư vấn Chuyên gia: " + specialtyName;
        }
        return "Tư vấn Dược sĩ";
    }

    private String getProductImageUrl(ProductEntity product) {
        return product.getPrimaryImage();
    }

    private String normalizeBlank(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UUID parseUuid(String value, String message) {
        try {
            return UUID.fromString(value);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, message);
        }
    }
}
