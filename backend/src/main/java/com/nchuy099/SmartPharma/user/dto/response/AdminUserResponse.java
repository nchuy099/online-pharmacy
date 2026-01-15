package com.nchuy099.SmartPharma.user.dto.response;

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
public class AdminUserResponse {
    String id;
    String email;
    String fullName;
    String phoneNumber;
    String role;
    String roleType;
    Boolean roleProtected;
    String roleDescription;
    String status;
    String avatarUrl;
    String qualifications;
    String education;
    String experience;
    String specialtyCode;
    String specialtyName;
    Boolean isApproved;
    Integer activeSessions;
    Long totalConsultations;
    java.math.BigDecimal profit;
    java.time.Instant createdAt;
}
