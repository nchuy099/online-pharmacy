package com.nchuy099.SmartPharma.user.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.user.enums.RoleType;
import com.nchuy099.SmartPharma.user.repository.RbacAuditLogRepository;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.entity.PermissionEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class RbacPolicyServiceTest {

    @Test
    void validateRolePermissionUpdate_shouldRejectProtectedRole() {
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        RbacAuditLogRepository auditLogRepository = org.mockito.Mockito.mock(RbacAuditLogRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = new RbacPolicyService(userRepository, auditLogRepository, securityUtils);

        RoleEntity actorRole = role("SUPER_ADMIN", RoleType.ADMIN, true);
        UserEntity actor = UserEntity.builder().role(actorRole).build();
        when(securityUtils.getCurrentUserId()).thenReturn(UUID.randomUUID());
        when(userRepository.findByIdWithRolePermissions(any())).thenReturn(Optional.of(actor));

        RoleEntity targetRole = role("CUSTOMER", RoleType.CUSTOMER, true);

        assertThatThrownBy(() -> policyService.validateRolePermissionUpdate(targetRole, Set.of(), List.of()))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Protected role cannot be modified");
    }

    @Test
    void validateRoleChange_shouldRejectSelfRoleChange() {
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        RbacAuditLogRepository auditLogRepository = org.mockito.Mockito.mock(RbacAuditLogRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = new RbacPolicyService(userRepository, auditLogRepository, securityUtils);

        UUID currentUserId = UUID.randomUUID();
        RoleEntity actorRole = role("SUPER_ADMIN", RoleType.ADMIN, true);
        UserEntity actor = UserEntity.builder().role(actorRole).build();
        actor.setId(currentUserId);
        when(securityUtils.getCurrentUserId()).thenReturn(currentUserId);
        when(userRepository.findByIdWithRolePermissions(currentUserId)).thenReturn(Optional.of(actor));

        assertThatThrownBy(() -> policyService.validateRoleChange(actor, role("STAFF", RoleType.ADMIN, false)))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Cannot change your own role");
    }

    @Test
    void validateRoleChange_shouldRejectNonAdminTargetsAndLastSuperAdminDemotion() {
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        RbacAuditLogRepository auditLogRepository = org.mockito.Mockito.mock(RbacAuditLogRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = new RbacPolicyService(userRepository, auditLogRepository, securityUtils);

        UUID actorId = UUID.randomUUID();
        RoleEntity actorRole = role("SUPER_ADMIN", RoleType.ADMIN, true);
        UserEntity actor = UserEntity.builder().role(actorRole).build();
        actor.setId(actorId);
        when(securityUtils.getCurrentUserId()).thenReturn(actorId);
        when(userRepository.findByIdWithRolePermissions(actorId)).thenReturn(Optional.of(actor));
        when(userRepository.countByRole_NameIgnoreCase("SUPER_ADMIN")).thenReturn(1L);

        UserEntity target = UserEntity.builder()
                .role(role("SUPER_ADMIN", RoleType.ADMIN, true))
                .build();
        target.setId(UUID.randomUUID());

        assertThatThrownBy(() -> policyService.validateRoleChange(target, role("STAFF", RoleType.ADMIN, false)))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Cannot change SUPER_ADMIN role");

        UserEntity customerTarget = UserEntity.builder()
                .role(role("CUSTOMER", RoleType.CUSTOMER, true))
                .build();
        customerTarget.setId(UUID.randomUUID());

        assertThatThrownBy(() -> policyService.validateRoleChange(customerTarget, role("PHARMACIST", RoleType.PHARMACIST, true)))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Only ADMIN roles can be changed");
    }

    @Test
    void validateRoleChange_shouldRejectChangingSuperAdminRole() {
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        RbacAuditLogRepository auditLogRepository = org.mockito.Mockito.mock(RbacAuditLogRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = new RbacPolicyService(userRepository, auditLogRepository, securityUtils);

        UUID actorId = UUID.randomUUID();
        RoleEntity actorRole = role("SUPER_ADMIN", RoleType.ADMIN, true);
        UserEntity actor = UserEntity.builder().role(actorRole).build();
        actor.setId(actorId);
        when(securityUtils.getCurrentUserId()).thenReturn(actorId);
        when(userRepository.findByIdWithRolePermissions(actorId)).thenReturn(Optional.of(actor));

        UserEntity target = UserEntity.builder()
                .role(role("SUPER_ADMIN", RoleType.ADMIN, true))
                .build();
        target.setId(UUID.randomUUID());

        assertThatThrownBy(() -> policyService.validateRoleChange(target, role("STAFF", RoleType.ADMIN, false)))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Cannot change SUPER_ADMIN role");
    }

    @Test
    void validateRolePermissionUpdate_shouldRejectNonAssignablePermission() {
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        RbacAuditLogRepository auditLogRepository = org.mockito.Mockito.mock(RbacAuditLogRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = new RbacPolicyService(userRepository, auditLogRepository, securityUtils);

        UUID actorId = UUID.randomUUID();
        RoleEntity actorRole = role("SUPER_ADMIN", RoleType.ADMIN, true);
        UserEntity actor = UserEntity.builder().role(actorRole).build();
        actor.setId(actorId);
        when(securityUtils.getCurrentUserId()).thenReturn(actorId);
        when(userRepository.findByIdWithRolePermissions(actorId)).thenReturn(Optional.of(actor));

        RoleEntity targetRole = role("STAFF", RoleType.ADMIN, false);
        PermissionEntity critical = permission("MANAGE_RBAC", RoleType.ADMIN, true, false);

        assertThatThrownBy(() -> policyService.validateRolePermissionUpdate(targetRole, Set.of(), List.of(critical)))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Permission is not assignable");
    }

    @Test
    void validateRoleChange_shouldAllowAdminToAdminTransition() {
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        RbacAuditLogRepository auditLogRepository = org.mockito.Mockito.mock(RbacAuditLogRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = new RbacPolicyService(userRepository, auditLogRepository, securityUtils);

        UUID actorId = UUID.randomUUID();
        RoleEntity actorRole = role("SUPER_ADMIN", RoleType.ADMIN, true);
        UserEntity actor = UserEntity.builder().role(actorRole).build();
        actor.setId(actorId);
        when(securityUtils.getCurrentUserId()).thenReturn(actorId);
        when(userRepository.findByIdWithRolePermissions(actorId)).thenReturn(Optional.of(actor));

        UserEntity target = UserEntity.builder()
                .role(role("STAFF", RoleType.ADMIN, false))
                .build();
        target.setId(UUID.randomUUID());

        assertThatCode(() -> policyService.validateRoleChange(target, role("OPS_ADMIN", RoleType.ADMIN, false)))
                .doesNotThrowAnyException();
    }

    private RoleEntity role(String name, RoleType type, Boolean protectedRole) {
        return RoleEntity.builder()
                .name(name)
                .roleType(type)
                .protectedRole(protectedRole)
                .permissions(new java.util.HashSet<>())
                .build();
    }

    private PermissionEntity permission(String name, RoleType type, Boolean critical, Boolean assignable) {
        return PermissionEntity.builder()
                .name(name)
                .roleType(type)
                .critical(critical)
                .assignable(assignable)
                .build();
    }
}
