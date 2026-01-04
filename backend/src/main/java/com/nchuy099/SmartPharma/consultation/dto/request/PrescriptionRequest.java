package com.nchuy099.SmartPharma.consultation.dto.request;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PrescriptionRequest {

    @NotBlank(message = "Customer ID cannot be blank")
    String customerId;

    @NotBlank(message = "Diagnosis cannot be blank")
    String diagnosis;

    String chatConversationId;

    String generalInstructions;

    Instant followUpDate;

    @NotEmpty(message = "Must have at least one prescribed item")
    @jakarta.validation.Valid
    List<PrescriptionItemRequest> items;

    @Getter
    @Setter
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class PrescriptionItemRequest {
        @NotBlank(message = "Product ID cannot be blank")
        String productId;

        @NotNull(message = "Quantity cannot be null")
        Integer quantity;

        @NotBlank(message = "Instructions cannot be blank")
        String instructions;
    }
}
