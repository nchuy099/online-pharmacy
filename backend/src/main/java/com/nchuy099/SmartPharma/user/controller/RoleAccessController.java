package com.nchuy099.SmartPharma.user.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.user.dto.response.CurrentRoleResponse;
import com.nchuy099.SmartPharma.user.service.RbacService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/roles")
@Slf4j
@RequiredArgsConstructor
public class RoleAccessController {

    private final RbacService rbacService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public CurrentRoleResponse getCurrentRole() {
        log.info("Get current user role request received");
        return rbacService.getCurrentUserRole();
    }
}
