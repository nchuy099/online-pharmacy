package com.nchuy099.SmartPharma.consultation.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PrescriptionResponse {
    UUID id;
    String customerId;
    String customerName;
    String pharmacistId;
    String pharmacistName;
    String diagnosis;
    String generalInstructions;
    Instant followUpDate;
    Instant createdAt;
    List<PrescriptionItemResponse> items;

    @Getter
    @Setter
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class PrescriptionItemResponse {
        UUID id;
        String productId;
        String productName;
        String productWebName;
        String productImageUrl;
        Integer quantity;
        String instructions;
    }
}
