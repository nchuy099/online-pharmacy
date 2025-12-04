package com.nchuy099.SmartPharma.user.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.nchuy099.SmartPharma.user.dto.request.ChangePasswordRequest;
import com.nchuy099.SmartPharma.user.dto.request.CreateAddressRequest;
import com.nchuy099.SmartPharma.user.dto.request.DeleteAddressRequest;
import com.nchuy099.SmartPharma.user.dto.request.UpdateAddressRequest;
import com.nchuy099.SmartPharma.user.dto.response.AddressListResponse;
import com.nchuy099.SmartPharma.user.dto.response.AddressResponse;
import com.nchuy099.SmartPharma.user.dto.response.DeleteAddressResponse;

import com.nchuy099.SmartPharma.user.dto.request.UpdateUserProfileReq;
import com.nchuy099.SmartPharma.user.dto.response.AvatarUploadUrlResp;
import com.nchuy099.SmartPharma.user.dto.response.UserProfileResp;
import com.nchuy099.SmartPharma.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/users")
@Slf4j
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me/details")
    @PreAuthorize("isAuthenticated()")
    public UserProfileResp getUserProfile() {
        log.info("Received Get user profile request");
        return userService.getProfile();
    }

    @PutMapping("/me/update")
    @PreAuthorize("isAuthenticated()")
    public UserProfileResp updateUserProfile(@RequestBody @Valid UpdateUserProfileReq req) {
        log.info("Received update user profile request");
        return userService.updateProfile(req);
    }

    @PostMapping("/me/avatar/upload-url/create")
    @PreAuthorize("isAuthenticated()")
    public AvatarUploadUrlResp createAvatarUploadUrl() {
        log.info("Received Create avatar upload url request");
        return userService.createAvatarUploadUrl();
    }

    @PutMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()")
    public void changePassword(@RequestBody @Valid ChangePasswordRequest req) {
        log.info("Received change password request");
        userService.changePassword(req);
    }

    @GetMapping("/me/addresses/default")
    @PreAuthorize("isAuthenticated()")
    public AddressResponse getDefaultAddress() {
        log.info("Received get default address request");
        return userService.getDefaultAddress();
    }

    @GetMapping("/me/addresses/list")
    @PreAuthorize("isAuthenticated()")
    public AddressListResponse getAddresses(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Received get addresses list request with page: {}, size: {}", page, size);
        return userService.getAddresses(page, size);
    }

    @PostMapping("/me/addresses/create")
    @PreAuthorize("isAuthenticated()")
    public AddressResponse createAddress(@RequestBody @Valid CreateAddressRequest req) {
        log.info("Received create address request");
        return userService.createAddress(req);
    }

    @PutMapping("/me/addresses/{id}/update")
    @PreAuthorize("isAuthenticated()")
    public AddressResponse updateAddress(
            @PathVariable(name = "id") String id,
            @RequestBody @Valid UpdateAddressRequest req) {
        log.info("Received update address request for id: {}", id);
        return userService.updateAddress(id, req);
    }

    @DeleteMapping("/me/addresses/delete")
    @PreAuthorize("isAuthenticated()")
    public DeleteAddressResponse deleteAddress(@RequestBody @Valid DeleteAddressRequest req) {
        log.info("Received delete address request for id: {}", req.getId());
        return userService.deleteAddress(req);
    }

}
