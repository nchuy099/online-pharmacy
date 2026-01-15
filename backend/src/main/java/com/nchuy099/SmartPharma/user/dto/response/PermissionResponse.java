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
public class PermissionResponse {
    private String id;
    private String name;
    private String description;
    private RoleType roleType;
    private Boolean critical;
    private Boolean assignable;
    private Instant createdAt;
    private Instant updatedAt;
}
