package com.nchuy099.SmartPharma.consultation.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.consultation.dto.response.AdminMedicalConsultationDetailResponse;
import com.nchuy099.SmartPharma.consultation.dto.response.AdminMedicalConsultationListResponse;
import com.nchuy099.SmartPharma.consultation.service.AdminMedicalConsultationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/medical-consultations")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('STAFF', 'SUPER_ADMIN')")
public class AdminMedicalConsultationController {

    private final AdminMedicalConsultationService adminMedicalConsultationService;

    @GetMapping
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_USER)")
    public AdminMedicalConsultationListResponse getConsultations(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "specialty", required = false) String specialty,
            @RequestParam(name = "assigned", required = false) Boolean assigned) {
        log.info(
                "Get medical consultations request received page={} size={} search={} status={} type={} specialty={} assigned={}",
                page, size, search, status, type, specialty, assigned);
        return adminMedicalConsultationService.getConsultations(page, size, search, status, type, specialty, assigned);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_USER)")
    public AdminMedicalConsultationDetailResponse getConsultationDetail(@PathVariable String id) {
        log.info("Get medical consultation detail request received id={}", id);
        return adminMedicalConsultationService.getConsultationDetail(id);
    }
}
