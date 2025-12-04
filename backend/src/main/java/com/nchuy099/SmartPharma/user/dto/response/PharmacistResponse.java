package com.nchuy099.SmartPharma.user.dto.response;

import java.time.Instant;
import java.math.BigDecimal;

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
public class PharmacistResponse {
    String id;
    String userId;
    String email;
    String fullName;
    String phoneNumber;
    String avatarUrl;
    String qualifications;
    String education;
    String experience;
    String specialtyCode;
    String specialtyName;
    Boolean isApproved;
    Integer activeSessions;
    Double rating;
    Long totalConsultations;
    BigDecimal profit;
    Instant createdAt;
}
