package com.nchuy099.SmartPharma.user.dto.response;

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
public class CurrentRoleResponse {
    private RoleType roleType;
}
