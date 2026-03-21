package com.nchuy099.SmartPharma.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.chat.entity.ChatConversationEntity;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.consultation.entity.PrescriptionEntity;
import com.nchuy099.SmartPharma.consultation.repository.PrescriptionRepository;
import com.nchuy099.SmartPharma.user.entity.PharmacistEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

class AdminMedicalConsultationServiceTest {

    @Test
    void getConsultations_shouldReturnPagedMetadataAndStats() {
        ChatConversationRepository chatConversationRepository = mock(ChatConversationRepository.class);
        PrescriptionRepository prescriptionRepository = mock(PrescriptionRepository.class);
        AdminMedicalConsultationService service = new AdminMedicalConsultationService(chatConversationRepository,
                prescriptionRepository);

        ChatConversationEntity assignedRoom = room(
                "ACTIVE",
                "PHARMACIST",
                "RESPIRATORY",
                "Tư vấn ho kéo dài",
                customer("Nguyen Van A"),
                pharmacist("Duoc si B", "RESPIRATORY", "Hô hấp"),
                Instant.parse("2026-05-20T08:00:00Z"),
                Instant.parse("2026-05-21T08:30:00Z"));
        ChatConversationEntity unassignedRoom = room(
                "CLOSED",
                "AI",
                null,
                "Chatbot sơ bộ",
                customer("Tran Thi C"),
                null,
                Instant.parse("2026-05-18T10:00:00Z"),
                Instant.parse("2026-05-18T11:00:00Z"));

        when(chatConversationRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(assignedRoom, unassignedRoom), PageRequest.of(0, 10), 2));
        when(chatConversationRepository.count()).thenReturn(2L);
        when(chatConversationRepository.countByStatusIgnoreCase("ACTIVE")).thenReturn(1L);
        when(chatConversationRepository.countByStatusIgnoreCase("CLOSED")).thenReturn(1L);
        when(chatConversationRepository.countByPharmacistIsNull()).thenReturn(1L);

        var response = service.getConsultations(1, 10, null, null, null, null, null);

        assertThat(response.getConsultations()).hasSize(2);
        assertThat(response.getConsultations().get(0).getCustomerName()).isEqualTo("Nguyen Van A");
        assertThat(response.getConsultations().get(0).getPharmacistName()).isEqualTo("Duoc si B");
        assertThat(response.getConsultations().get(0).getSpecialtyCode()).isEqualTo("RESPIRATORY");
        assertThat(response.getConsultations().get(0).getSpecialtyName()).isEqualTo("Hô hấp");
        assertThat(response.getConsultations().get(0).getTitle()).isEqualTo("Tư vấn ho kéo dài");
        assertThat(response.getConsultations().get(1).getPharmacistName()).isNull();
        assertThat(response.getPagination().getTotalElements()).isEqualTo(2);
        assertThat(response.getStats().getTotal()).isEqualTo(2);
        assertThat(response.getStats().getActive()).isEqualTo(1);
        assertThat(response.getStats().getClosed()).isEqualTo(1);
        assertThat(response.getStats().getUnassigned()).isEqualTo(1);
    }

    @Test
    void getConsultationDetail_shouldIncludeTimelineAndPrescriptions() {
        ChatConversationRepository chatConversationRepository = mock(ChatConversationRepository.class);
        PrescriptionRepository prescriptionRepository = mock(PrescriptionRepository.class);
        AdminMedicalConsultationService service = new AdminMedicalConsultationService(chatConversationRepository,
                prescriptionRepository);

        ChatConversationEntity room = room(
                "CLOSED",
                "PHARMACIST",
                "CARDIOLOGY",
                "Tư vấn tim mạch",
                customer("Le Thi D"),
                pharmacist("Duoc si E", "CARDIOLOGY", "Tim mạch"),
                Instant.parse("2026-05-10T09:00:00Z"),
                Instant.parse("2026-05-11T15:00:00Z"));
        room.setSummary("Theo dõi huyết áp");

        PrescriptionEntity prescription = PrescriptionEntity.builder()
                .customer(room.getUser())
                .pharmacist(room.getPharmacist().getUser())
                .chatConversation(room)
                .diagnosis("Tang huyet ap")
                .generalInstructions("Uong sau an")
                .items(Set.of())
                .build();
        prescription.setId(UUID.randomUUID());
        prescription.setCreatedAt(Instant.parse("2026-05-11T10:30:00Z"));

        when(chatConversationRepository.findById(room.getId())).thenReturn(Optional.of(room));
        when(prescriptionRepository.findByChatConversationIdOrderByCreatedAtDesc(room.getId()))
                .thenReturn(List.of(prescription));

        var response = service.getConsultationDetail(room.getId().toString());

        assertThat(response.getId()).isEqualTo(room.getId().toString());
        assertThat(response.getCustomerName()).isEqualTo("Le Thi D");
        assertThat(response.getPharmacistName()).isEqualTo("Duoc si E");
        assertThat(response.getSpecialtyName()).isEqualTo("Tim mạch");
        assertThat(response.getSummary()).isEqualTo("Theo dõi huyết áp");
        assertThat(response.getPrescriptions()).hasSize(1);
        assertThat(response.getPrescriptions().get(0).getDiagnosis()).isEqualTo("Tang huyet ap");
        assertThat(response.getTimeline()).extracting("type")
                .contains("SESSION_CREATED", "PRESCRIPTION_CREATED", "SESSION_CLOSED");
    }

    @Test
    void getConsultationDetail_shouldThrowWhenConversationMissing() {
        ChatConversationRepository chatConversationRepository = mock(ChatConversationRepository.class);
        PrescriptionRepository prescriptionRepository = mock(PrescriptionRepository.class);
        AdminMedicalConsultationService service = new AdminMedicalConsultationService(chatConversationRepository,
                prescriptionRepository);
        UUID roomId = UUID.randomUUID();

        when(chatConversationRepository.findById(roomId)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> service.getConsultationDetail(roomId.toString()));
    }

    private static ChatConversationEntity room(
            String status,
            String type,
            String consultationId,
            String title,
            UserEntity customer,
            PharmacistEntity pharmacist,
            Instant createdAt,
            Instant updatedAt) {
        ChatConversationEntity room = ChatConversationEntity.builder()
                .status(status)
                .type(type)
                .consultationId(consultationId)
                .title(title)
                .user(customer)
                .pharmacist(pharmacist)
                .build();
        room.setId(UUID.randomUUID());
        room.setCreatedAt(createdAt);
        room.setUpdatedAt(updatedAt);
        return room;
    }

    private static UserEntity customer(String fullName) {
        UserEntity user = UserEntity.builder()
                .fullName(fullName)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private static PharmacistEntity pharmacist(String fullName, String specialtyCode, String specialtyName) {
        CatalogEntity specialty = CatalogEntity.builder()
                .type(CatalogType.SPECIALTY)
                .code(specialtyCode)
                .name(specialtyName)
                .build();
        UserEntity user = customer(fullName);
        PharmacistEntity pharmacist = PharmacistEntity.builder()
                .user(user)
                .specialty(specialty)
                .isApproved(true)
                .build();
        pharmacist.setId(UUID.randomUUID());
        return pharmacist;
    }
}
