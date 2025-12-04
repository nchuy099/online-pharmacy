package com.nchuy099.SmartPharma.user.controller;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.consultation.dto.response.PrescriptionResponse;
import com.nchuy099.SmartPharma.consultation.service.ConsultationService;
import com.nchuy099.SmartPharma.user.dto.response.CustomerChatProfileResponse;
import com.nchuy099.SmartPharma.user.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/customers")
@Slf4j
@RequiredArgsConstructor
public class CustomerProfileController {
    private final UserService userService;
    private final ConsultationService consultationService;

    @GetMapping("/{id}/chat-profile")
    public CustomerChatProfileResponse getCustomerChatProfile(@PathVariable String id) {
        log.info("Get customer chat profile request received for id: {}", id);
        return userService.getCustomerChatProfile(id);
    }

    @GetMapping("/me/prescriptions")
    public Page<PrescriptionResponse> getMyPrescriptions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Get my prescriptions request received");
        return consultationService.getMyPrescriptions(page, size);
    }
}
