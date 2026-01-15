package com.nchuy099.SmartPharma.user.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.dto.request.CreateRoleRequest;
import com.nchuy099.SmartPharma.user.dto.request.UpdateRolePermissionsRequest;
import com.nchuy099.SmartPharma.user.dto.request.UpdateRoleRequest;
import com.nchuy099.SmartPharma.user.dto.response.CurrentRoleResponse;
import com.nchuy099.SmartPharma.user.dto.response.PermissionResponse;
import com.nchuy099.SmartPharma.user.dto.response.RoleOptionResponse;
import com.nchuy099.SmartPharma.user.dto.response.RolePermissionResponse;
import com.nchuy099.SmartPharma.user.dto.response.RoleSummaryResponse;
import com.nchuy099.SmartPharma.user.entity.PermissionEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.enums.RoleType;
import com.nchuy099.SmartPharma.user.repository.PermissionRepository;
import com.nchuy099.SmartPharma.user.repository.RoleRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RbacService {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final RbacPolicyService policyService;

    @Transactional(readOnly = true)
    public List<RoleSummaryResponse> getRoleSummaries() {
        Sort sort = roleListSort();
        Map<String, Long> userCountByRole = userRepository.countUsersByRole().stream()
                .collect(Collectors.toMap(
                        UserRepository.UserRoleCountProjection::getRoleName,
                        UserRepository.UserRoleCountProjection::getTotal,
                        Long::sum));

        return roleRepository.findAll(sort).stream()
                .map(role -> toRoleSummaryResponse(role, userCountByRole.getOrDefault(role.getName(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RolePermissionResponse> getRoles() {
        return roleRepository.findAll(roleListSort()).stream()
                .map(this::toRoleResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoleOptionResponse> getRoleOptions() {
        return roleRepository.findAll(roleListSort()).stream()
                .filter(role -> !isSuperAdmin(role))
                .map(this::toRoleOptionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoleSummaryResponse> getAdminRoleSummaries() {
        Map<String, Long> userCountByRole = userRepository.countUsersByRole().stream()
                .collect(Collectors.toMap(
                        UserRepository.UserRoleCountProjection::getRoleName,
                        UserRepository.UserRoleCountProjection::getTotal,
                        Long::sum));

        return roleRepository.findByRoleType(RoleType.ADMIN, roleListSort()).stream()
                .map(role -> toRoleSummaryResponse(role, userCountByRole.getOrDefault(role.getName(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RolePermissionResponse> getAdminRoles() {
        return roleRepository.findByRoleType(RoleType.ADMIN, roleListSort()).stream()
                .map(this::toRoleResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoleOptionResponse> getAdminRoleOptions() {
        return roleRepository.findAll(roleListSort()).stream()
                .filter(role -> !isSuperAdmin(role))
                .map(this::toRoleOptionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RolePermissionResponse getRole(UUID roleId) {
        return toRoleResponse(getRoleEntity(roleId));
    }

    @Transactional(readOnly = true)
    public RolePermissionResponse getCurrentUserAccess() {
        UUID userId = securityUtils.getCurrentUserId();
        UserEntity user = userRepository.findByIdWithRolePermissions(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found"));
        RoleEntity role = user.getRole();
        if (role == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "Role not found");
        }
        return toRoleResponse(role);
    }

    @Transactional(readOnly = true)
    public CurrentRoleResponse getCurrentUserRole() {
        UUID userId = securityUtils.getCurrentUserId();
        UserEntity user = userRepository.findByIdWithRolePermissions(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found"));
        RoleEntity role = user.getRole();
        if (role == null || role.getRoleType() == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "Role not found");
        }
        return CurrentRoleResponse.builder()
                .roleType(role.getRoleType())
                .build();
    }

    @Transactional
    public RolePermissionResponse createRole(CreateRoleRequest request) {
        String normalizedName = normalizeRoleName(request.getName());
        if (isSuperAdminName(normalizedName)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot create SUPER_ADMIN role");
        }
        if (roleRepository.findByNameIgnoreCase(normalizedName).isPresent()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Role already exists");
        }

        policyService.validateRoleCreation(request.getRoleType());

        RoleEntity saved = roleRepository.save(RoleEntity.builder()
                .name(normalizedName)
                .description(trimToNull(request.getDescription()))
                .roleType(request.getRoleType())
                .protectedRole(Boolean.FALSE)
                .build());

        policyService.audit(policyService.getCurrentActor().getId(), "CREATE_ROLE", "ROLE",
                saved.getId().toString(), null, describeRole(saved), null);
        return toRoleResponse(saved);
    }

    @Transactional
    public RolePermissionResponse updateRole(UUID roleId, UpdateRoleRequest request) {
        RoleEntity role = getRoleEntity(roleId);
        policyService.validateRoleUpdate(role);

        String normalizedName = normalizeRoleName(request.getName());
        if (isSuperAdminName(normalizedName)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot use SUPER_ADMIN role name");
        }

        roleRepository.findByNameIgnoreCase(normalizedName)
                .filter(existing -> !existing.getId().equals(roleId))
                .ifPresent(existing -> {
                    throw new AppException(ErrorCode.BAD_REQUEST, "Role already exists");
                });

        String beforeState = describeRole(role);
        role.setName(normalizedName);
        role.setDescription(trimToNull(request.getDescription()));
        RoleEntity saved = roleRepository.save(role);
        policyService.audit(policyService.getCurrentActor().getId(), "UPDATE_ROLE", "ROLE",
                saved.getId().toString(), beforeState, describeRole(saved), null);
        return toRoleResponse(saved);
    }

    @Transactional
    public void deleteRole(UUID roleId) {
        RoleEntity role = getRoleEntity(roleId);
        long assignedUserCount = userRepository.countByRole_NameIgnoreCase(role.getName());
        policyService.validateRoleDeletion(role, assignedUserCount);

        String beforeState = describeRole(role);
        roleRepository.delete(role);
        policyService.audit(policyService.getCurrentActor().getId(), "DELETE_ROLE", "ROLE",
                roleId.toString(), beforeState, null, null);
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> getPermissions() {
        Sort sort = Sort.by(Sort.Order.asc("roleType"), Sort.Order.asc("name"));
        return permissionRepository.findAll(sort).stream()
                .map(this::toPermissionResponse)
                .toList();
    }

    @Transactional
    public RolePermissionResponse updateRolePermissions(UUID roleId, UpdateRolePermissionsRequest request) {
        RoleEntity role = getRoleEntity(roleId);
        policyService.ensureRoleIsEditable(role);

        Set<PermissionEntity> currentPermissions = new LinkedHashSet<>(role.getPermissions());
        Set<PermissionEntity> requestedPermissions = new LinkedHashSet<>();
        Set<String> normalizedNames = new LinkedHashSet<>();
        for (String permissionName : request.getPermissionNames()) {
            String normalized = normalizePermissionName(permissionName);
            if (!normalizedNames.add(normalized)) {
                continue;
            }

            PermissionEntity permission = permissionRepository.findByNameIgnoreCase(normalized)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Permission not found: " + normalized));
            requestedPermissions.add(permission);
        }

        policyService.validateRolePermissionUpdate(role, currentPermissions, requestedPermissions);
        Set<PermissionEntity> finalPermissions = policyService.buildValidatedRolePermissions(role, currentPermissions, requestedPermissions);
        String beforeState = describeRole(role);

        role.getPermissions().clear();
        role.getPermissions().addAll(finalPermissions);
        RoleEntity saved = roleRepository.save(role);
        policyService.audit(policyService.getCurrentActor().getId(), "UPDATE_ROLE_PERMISSIONS", "ROLE",
                saved.getId().toString(), beforeState, describeRole(saved), null);
        return toRoleResponse(saved);
    }

    private RoleEntity getRoleEntity(UUID roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Role not found"));
    }

    private RolePermissionResponse toRoleResponse(RoleEntity role) {
        return RolePermissionResponse.builder()
                .id(role.getId().toString())
                .name(role.getName())
                .description(role.getDescription())
                .roleType(role.getRoleType())
                .protectedRole(role.getProtectedRole())
                .userCount(userRepository.countByRole_NameIgnoreCase(role.getName()))
                .permissions(role.getPermissions().stream()
                        .map(this::toPermissionResponse)
                        .toList())
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }

    private RoleSummaryResponse toRoleSummaryResponse(RoleEntity role, Long userCount) {
        return RoleSummaryResponse.builder()
                .id(role.getId().toString())
                .name(role.getName())
                .description(role.getDescription())
                .roleType(role.getRoleType())
                .protectedRole(role.getProtectedRole())
                .permissionCount((long) role.getPermissions().size())
                .userCount(userCount)
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }

    private PermissionResponse toPermissionResponse(PermissionEntity permission) {
        return PermissionResponse.builder()
                .id(permission.getId().toString())
                .name(permission.getName())
                .description(permission.getDescription())
                .roleType(permission.getRoleType())
                .critical(permission.getCritical())
                .assignable(permission.getAssignable())
                .createdAt(permission.getCreatedAt())
                .updatedAt(permission.getUpdatedAt())
                .build();
    }

    private RoleOptionResponse toRoleOptionResponse(RoleEntity role) {
        return RoleOptionResponse.builder()
                .id(role.getId().toString())
                .name(role.getName())
                .description(role.getDescription())
                .roleType(role.getRoleType())
                .protectedRole(role.getProtectedRole())
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }

    private String describeRole(RoleEntity role) {
        return role.getName() + "|" + role.getRoleType() + "|" + Boolean.TRUE.equals(role.getProtectedRole())
                + "|" + role.getPermissions().stream().map(PermissionEntity::getName).sorted().toList();
    }

    private String normalizePermissionName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Permission name must not be blank");
        }
        return name.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeRoleName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Role name must not be blank");
        }
        return name.trim().toUpperCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private boolean isSuperAdmin(RoleEntity role) {
        return role != null && role.getName() != null && "SUPER_ADMIN".equalsIgnoreCase(role.getName());
    }

    private boolean isSuperAdminName(String name) {
        return name != null && "SUPER_ADMIN".equalsIgnoreCase(name);
    }

    private Sort roleListSort() {
        return Sort.by(Sort.Order.asc("roleType"), Sort.Order.asc("name"));
    }
}
