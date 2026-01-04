package com.nchuy099.SmartPharma.consultation.dto.response;

import java.time.Instant;

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
public class AdminMedicalConsultationListItemResponse {
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
    Instant createdAt;
    Instant updatedAt;
}
