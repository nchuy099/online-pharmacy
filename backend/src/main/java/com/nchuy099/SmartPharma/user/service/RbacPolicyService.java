package com.nchuy099.SmartPharma.user.service;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.user.enums.RoleType;
import com.nchuy099.SmartPharma.user.entity.RbacAuditLogEntity;
import com.nchuy099.SmartPharma.user.repository.RbacAuditLogRepository;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.entity.PermissionEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RbacPolicyService {

    private final UserRepository userRepository;
    private final RbacAuditLogRepository auditLogRepository;
    private final SecurityUtils securityUtils;

    public UserEntity getCurrentActor() {
        UUID currentUserId = securityUtils.getCurrentUserId();
        return userRepository.findByIdWithRolePermissions(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Current user not found"));
    }

    public RoleEntity getCurrentActorRole() {
        UserEntity actor = getCurrentActor();
        if (actor.getRole() == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "Current user role not found");
        }
        return actor.getRole();
    }

    public void validateRolePermissionUpdate(RoleEntity targetRole, Collection<PermissionEntity> currentPermissions,
            Collection<PermissionEntity> requestedPermissions) {
        RoleEntity actorRole = getCurrentActorRole();
        ensureActorIsSuperAdmin(actorRole);
        ensureRoleIsEditable(targetRole);

        for (PermissionEntity permission : requestedPermissions) {
            if (permission == null) {
                throw new AppException(ErrorCode.NOT_FOUND, "Permission not found");
            }
            if (!Boolean.TRUE.equals(permission.getAssignable())
                    && !containsPermission(currentPermissions, permission)) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Permission is not assignable");
            }
            ensurePermissionTypeMatchesRole(targetRole, permission);
        }
    }

    public void validateRoleCreation(RoleType roleType) {
        RoleEntity actorRole = getCurrentActorRole();
        if (roleType == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Role type is required");
        }
        ensureActorIsSuperAdmin(actorRole);
        if (actorRole.getRoleType() != roleType) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Role type mismatch");
        }
    }

    public void validateRoleUpdate(RoleEntity targetRole) {
        RoleEntity actorRole = getCurrentActorRole();
        ensureActorIsSuperAdmin(actorRole);
        ensureRoleIsEditable(targetRole);
    }

    public void validateRoleDeletion(RoleEntity targetRole, long assignedUserCount) {
        RoleEntity actorRole = getCurrentActorRole();
        ensureActorIsSuperAdmin(actorRole);
        ensureRoleIsEditable(targetRole);
        if (assignedUserCount > 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot delete a role that still has users");
        }
    }

    public void validateRoleChange(UserEntity targetUser, RoleEntity newRole) {
        UserEntity actor = getCurrentActor();
        RoleEntity actorRole = getCurrentActorRole();
        ensureActorIsSuperAdmin(actorRole);

        if (actor.getId() != null && actor.getId().equals(targetUser.getId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot change your own role");
        }

        RoleEntity currentRole = targetUser.getRole();
        if (isSuperAdminRole(currentRole) && !sameRole(currentRole, newRole)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot change SUPER_ADMIN role");
        }

        if (currentRole != null && newRole != null) {
            if (currentRole.getRoleType() != RoleType.ADMIN || newRole.getRoleType() != RoleType.ADMIN) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Only ADMIN roles can be changed");
            }

            if (currentRole.getName() != null
                    && "SUPER_ADMIN".equalsIgnoreCase(currentRole.getName())
                    && !newRole.getName().equalsIgnoreCase("SUPER_ADMIN")
                    && userRepository.countByRole_NameIgnoreCase("SUPER_ADMIN") <= 1) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Cannot remove the last SUPER_ADMIN");
            }
        }
    }

    public void validateAdminUserCreation(RoleEntity selectedRole) {
        if (selectedRole == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "Role not found");
        }

        if (isSuperAdminRole(selectedRole)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot assign SUPER_ADMIN role");
        }
    }

    public Set<PermissionEntity> buildValidatedRolePermissions(RoleEntity targetRole, Set<PermissionEntity> currentPermissions,
            Collection<PermissionEntity> requestedPermissions) {
        Set<PermissionEntity> preserved = new LinkedHashSet<>();
        for (PermissionEntity permission : currentPermissions) {
            if (!Boolean.TRUE.equals(permission.getAssignable())) {
                preserved.add(permission);
            }
        }

        Set<PermissionEntity> result = new LinkedHashSet<>(preserved);
        for (PermissionEntity permission : requestedPermissions) {
            ensurePermissionTypeMatchesRole(targetRole, permission);
            result.add(permission);
        }
        return result;
    }

    public void ensureRoleIsEditable(RoleEntity role) {
        if (Boolean.TRUE.equals(role.getProtectedRole())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Protected role cannot be modified");
        }
    }

    public void ensurePermissionAssignableToRole(RoleEntity role, PermissionEntity permission) {
        if (permission == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "Permission not found");
        }
        ensurePermissionTypeMatchesRole(role, permission);
        if (!Boolean.TRUE.equals(permission.getAssignable())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Permission is not assignable");
        }
    }

    public void audit(UUID actorUserId, String action, String targetType, String targetId,
            String beforeState, String afterState, String reason) {
        auditLogRepository.save(RbacAuditLogEntity.builder()
                .actorUserId(actorUserId)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .beforeState(beforeState)
                .afterState(afterState)
                .reason(reason)
                .build());
    }

    private void ensureActorIsSuperAdmin(RoleEntity actorRole) {
        if (!isSuperAdminRole(actorRole)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Only SUPER_ADMIN can manage RBAC");
        }
    }

    private void ensurePermissionTypeMatchesRole(RoleEntity role, PermissionEntity permission) {
        if (role.getRoleType() != permission.getRoleType()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Permission role type mismatch");
        }
    }

    private boolean containsPermission(Collection<PermissionEntity> permissions, PermissionEntity target) {
        if (permissions == null || target == null || target.getId() == null) {
            return false;
        }
        return permissions.stream()
                .filter(permission -> permission != null && permission.getId() != null)
                .anyMatch(permission -> permission.getId().equals(target.getId()));
    }

    private boolean isSuperAdminRole(RoleEntity role) {
        return role != null && role.getName() != null && "SUPER_ADMIN".equalsIgnoreCase(role.getName());
    }

    private boolean sameRole(RoleEntity left, RoleEntity right) {
        if (left == null || right == null || left.getName() == null || right.getName() == null) {
            return false;
        }
        return left.getName().equalsIgnoreCase(right.getName());
    }
}
