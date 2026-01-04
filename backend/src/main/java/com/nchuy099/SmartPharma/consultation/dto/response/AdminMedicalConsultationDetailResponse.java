package com.nchuy099.SmartPharma.consultation.dto.response;

import java.time.Instant;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminMedicalConsultationDetailResponse {
    String id;
    String customerId;
    String customerName;
    String pharmacistId;
    String pharmacistName;
    String specialtyCode;
    String specialtyName;
    String consultationId;
    String type;
    String status;
    String title;
    String summary;
    Instant createdAt;
    Instant updatedAt;
    List<AdminMedicalConsultationTimelineEventResponse> timeline;
    List<PrescriptionResponse> prescriptions;
}
