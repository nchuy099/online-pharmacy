package com.nchuy099.SmartPharma.user.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.user.dto.response.PermissionResponse;
import com.nchuy099.SmartPharma.user.service.RbacService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/permissions")
@Slf4j
@RequiredArgsConstructor
public class PermissionController {

    private final RbacService rbacService;

    @GetMapping
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_RBAC)")
    public List<PermissionResponse> getPermissions() {
        log.info("Get RBAC permissions request received");
        return rbacService.getPermissions();
    }
}
