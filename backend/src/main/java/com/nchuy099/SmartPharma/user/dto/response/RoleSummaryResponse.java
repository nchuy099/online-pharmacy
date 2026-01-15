package com.nchuy099.SmartPharma.user.dto.response;

import java.time.Instant;

import com.nchuy099.SmartPharma.user.enums.RoleType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleSummaryResponse {
    private String id;
    private String name;
    private String description;
    private RoleType roleType;
    private Boolean protectedRole;
    private Long permissionCount;
    private Long userCount;
    private Instant createdAt;
    private Instant updatedAt;
}
