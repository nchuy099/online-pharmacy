package com.nchuy099.SmartPharma.user.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.user.dto.request.CreateRoleRequest;
import com.nchuy099.SmartPharma.user.dto.request.UpdateRolePermissionsRequest;
import com.nchuy099.SmartPharma.user.dto.request.UpdateRoleRequest;
import com.nchuy099.SmartPharma.user.dto.response.RoleOptionResponse;
import com.nchuy099.SmartPharma.user.dto.response.RolePermissionResponse;
import com.nchuy099.SmartPharma.user.dto.response.RoleSummaryResponse;
import com.nchuy099.SmartPharma.user.service.RbacService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/roles")
@Slf4j
@RequiredArgsConstructor
public class RoleController {

    private final RbacService rbacService;

    @GetMapping
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_RBAC)")
    public List<RolePermissionResponse> getRoles() {
        log.info("Get RBAC roles request received");
        return rbacService.getRoles();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_RBAC)")
    public List<RolePermissionResponse> getAdminRoles() {
        log.info("Get admin RBAC roles request received");
        return rbacService.getAdminRoles();
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_RBAC)")
    public List<RoleSummaryResponse> getRoleSummaries() {
        log.info("Get RBAC role summaries request received");
        return rbacService.getRoleSummaries();
    }

    @GetMapping("/admin/summary")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_RBAC)")
    public List<RoleSummaryResponse> getAdminRoleSummaries() {
        log.info("Get admin RBAC role summaries request received");
        return rbacService.getAdminRoleSummaries();
    }

    @GetMapping("/options")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_RBAC)")
    public List<RoleOptionResponse> getRoleOptions() {
        log.info("Get RBAC role options request received");
        return rbacService.getRoleOptions();
    }

    @GetMapping("/admin/options")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_RBAC)")
    public List<RoleOptionResponse> getAdminRoleOptions() {
        log.info("Get admin RBAC role options request received");
        return rbacService.getAdminRoleOptions();
    }

    @GetMapping("/{roleId:[0-9a-fA-F\\-]{36}}")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_RBAC)")
    public RolePermissionResponse getRole(@PathVariable UUID roleId) {
        log.info("Get RBAC role request received roleId={}", roleId);
        return rbacService.getRole(roleId);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public RolePermissionResponse getCurrentUserAccess() {
        log.info("Get current user RBAC access request received");
        return rbacService.getCurrentUserAccess();
    }

    @PostMapping("/create")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_RBAC)")
    public RolePermissionResponse createRole(@RequestBody @Valid CreateRoleRequest request) {
        log.info("Create role request received");
        return rbacService.createRole(request);
    }

    @PutMapping("/{roleId:[0-9a-fA-F\\-]{36}}/update")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_RBAC)")
    public RolePermissionResponse updateRole(
            @PathVariable UUID roleId,
            @RequestBody @Valid UpdateRoleRequest request) {
        log.info("Update role request received roleId={}", roleId);
        return rbacService.updateRole(roleId, request);
    }

    @DeleteMapping("/{roleId:[0-9a-fA-F\\-]{36}}/delete")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_RBAC)")
    public void deleteRole(@PathVariable UUID roleId) {
        log.info("Delete role request received roleId={}", roleId);
        rbacService.deleteRole(roleId);
    }

    @PutMapping("/{roleId:[0-9a-fA-F\\-]{36}}/permissions")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).MANAGE_RBAC)")
    public RolePermissionResponse updateRolePermissions(
            @PathVariable UUID roleId,
            @RequestBody @Valid UpdateRolePermissionsRequest request) {
        log.info("Update role permissions request received roleId={}", roleId);
        return rbacService.updateRolePermissions(roleId, request);
    }
}
