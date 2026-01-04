package com.nchuy099.SmartPharma.consultation.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.consultation.dto.request.PrescriptionRequest;
import com.nchuy099.SmartPharma.consultation.dto.response.PatientHistoryResponse;
import com.nchuy099.SmartPharma.consultation.dto.response.PrescriptionResponse;
import com.nchuy099.SmartPharma.consultation.service.ConsultationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/pharmacists")
@Slf4j
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService prescriptionService;

    @GetMapping("/customers/{id}/history")
    @PreAuthorize("hasRole('PHARMACIST')")
    public PatientHistoryResponse getPatientHistory(
            @PathVariable String id,
            @RequestParam(defaultValue = "1") int orderPage,
            @RequestParam(defaultValue = "5") int orderSize,
            @RequestParam(defaultValue = "1") int rxPage,
            @RequestParam(defaultValue = "5") int rxSize) {
        log.info("Get patient history request received for customer: {}", id);
        return prescriptionService.getPatientHistory(UUID.fromString(id), orderPage, orderSize, rxPage, rxSize);
    }

    @PostMapping("/prescriptions")
    @PreAuthorize("hasRole('PHARMACIST')")
    public PrescriptionResponse createPrescription(@Valid @RequestBody PrescriptionRequest request) {
        log.info("Create prescription request received for customer: {}", request.getCustomerId());
        return prescriptionService.createPrescription(request);
    }
    
    @GetMapping("/customers/{id}/prescriptions")
    @PreAuthorize("hasRole('PHARMACIST')")
    public Page<PrescriptionResponse> getCustomerPrescriptions(
            @PathVariable String id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Get customer prescriptions request received for customer: {}", id);
        return prescriptionService.getCustomerPrescriptions(UUID.fromString(id), page, size);
    }
}
