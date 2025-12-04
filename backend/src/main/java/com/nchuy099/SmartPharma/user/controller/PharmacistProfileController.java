package com.nchuy099.SmartPharma.user.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.nchuy099.SmartPharma.user.dto.request.PharmacistUpdateRequest;
import com.nchuy099.SmartPharma.user.dto.response.PharmacistResponse;
import com.nchuy099.SmartPharma.user.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/pharmacists")
@Slf4j
@RequiredArgsConstructor
public class PharmacistProfileController {

    private final UserService userService;

    @GetMapping("/me/details")
    @PreAuthorize("hasRole('PHARMACIST')")
    public PharmacistResponse getOwnProfile() {
        log.info("Pharmacist request: get own profile");
        return userService.getOwnPharmacistProfile();
    }

    @PutMapping("/me/pharmacist-profile")
    @PreAuthorize("hasRole('PHARMACIST')")
    public PharmacistResponse updateOwnPharmacistProfile(@RequestBody PharmacistUpdateRequest req) {
        log.info("Pharmacist request: update own pharmacist profile");
        return userService.updateOwnPharmacistProfile(req);
    }
}
