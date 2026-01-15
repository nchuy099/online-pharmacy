package com.nchuy099.SmartPharma.user.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.nchuy099.SmartPharma.user.enums.RbacPermissions;
import com.nchuy099.SmartPharma.user.dto.request.AdminCreateUserReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminUpdateUserReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminUpdatePharmacistProfileReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminChangePasswordReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminChangeRoleReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminChangeStatusReq;
import com.nchuy099.SmartPharma.user.dto.response.AddressListResponse;
import com.nchuy099.SmartPharma.user.dto.response.AdminUserListResponse;
import com.nchuy099.SmartPharma.user.dto.response.AdminUserResponse;
import com.nchuy099.SmartPharma.user.service.UserService;
import com.nchuy099.SmartPharma.order.domain.entity.OrderEntity;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.nchuy099.SmartPharma.common.dto.Pagination;
import com.nchuy099.SmartPharma.user.entity.AddressEntity;
import com.nchuy099.SmartPharma.user.repository.AddressRepository;
import com.nchuy099.SmartPharma.user.dto.response.AddressResponse;

import java.util.stream.Collectors;
import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin/users")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'SUPER_ADMIN')")
public class AdminUserController {

    private final UserService userService;
    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;

    @PostMapping({ "", "/create" })
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).CREATE_USER)")
    public AdminUserResponse createUser(@Valid @RequestBody AdminCreateUserReq req) {
        log.info("Received create user request from admin for email: {}", req.getEmail());
        return userService.adminCreateUser(req);
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_USER)")
    public AdminUserListResponse getUserList(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "specialty", required = false) String specialty) {
        log.info("Received get users list request for admin with page: {}, size: {}, search: {}, status: {}, role: {}, specialty: {}",
                page, size, search, status, role, specialty);
        return userService.getUserList(page, size, search, status, role, specialty);
    }

    @GetMapping("/admins/list")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_USER)")
    public AdminUserListResponse getAdminUserList(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "status", required = false) String status) {
        log.info("Received get admin users list request with page: {}, size: {}, search: {}, status: {}",
                page, size, search, status);
        return userService.getAdminUserList(page, size, search, status);
    }

    @GetMapping("/details")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_USER)")
    public AdminUserResponse getUserDetails(@RequestParam(name = "id") String id) {
        log.info("Received get user details request for admin with id (query): {}", id);
        return userService.getUserDetails(id);
    }

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_USER)")
    public AdminUserResponse getUserDetailsPath(@PathVariable(name = "id") String id) {
        log.info("Received get user details request for admin with id (path): {}", id);
        return userService.getUserDetails(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).UPDATE_USER)")
    public AdminUserResponse updateUser(
            @PathVariable(name = "id") String id,
            @Valid @RequestBody AdminUpdateUserReq req) {
        log.info("Received update user request for admin with id: {}", id);
        return userService.adminUpdateUser(id, req);
    }

    @PutMapping("/{id}/pharmacist-profile")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).UPDATE_USER)")
    public AdminUserResponse updatePharmacistProfile(
            @PathVariable(name = "id") String id,
            @RequestBody AdminUpdatePharmacistProfileReq req) {
        log.info("Received update pharmacist profile request for admin with id: {}", id);
        return userService.adminUpdatePharmacistProfile(id, req);
    }

    @PutMapping("/{id}/password/reset")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).RESET_USER_PASSWORD)")
    public void resetUserPassword(
            @PathVariable(name = "id") String id,
            @Valid @RequestBody AdminChangePasswordReq req) {
        log.info("Received reset password request for admin with id: {}", id);
        userService.adminResetPassword(id, req);
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).ASSIGN_USER_ROLE)")
    public AdminUserResponse changeUserRole(
            @PathVariable(name = "id") String id,
            @Valid @RequestBody AdminChangeRoleReq req) {
        log.info("Received change role request for admin with id: {}", id);
        return userService.adminChangeRole(id, req);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).UPDATE_USER_STATUS)")
    public AdminUserResponse changeUserStatus(
            @PathVariable(name = "id") String id,
            @Valid @RequestBody AdminChangeStatusReq req) {
        log.info("Received change status request for admin with id: {}", id);
        return userService.adminChangeStatus(id, req);
    }

    @GetMapping("/{id}/addresses")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_USER)")
    public AddressListResponse getUserAddresses(
            @PathVariable(name = "id") String id,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Received get user addresses request for admin with id: {}", id);
        
        UUID userId = UUID.fromString(id);
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<AddressEntity> addressPage = addressRepository.findByUserId(userId, pageable);

        List<AddressResponse> addresses = addressPage.getContent().stream()
                .map(address -> AddressResponse.builder()
                        .id(address.getId().toString())
                        .fullName(address.getFullName())
                        .phoneNumber(address.getPhoneNumber())
                        .address(address.getAddress())
                        .provinceName(address.getProvinceName())
                        .districtName(address.getDistrictName())
                        .wardName(address.getWardName())
                        .isDefault(address.getIsDefault())
                        .build())
                .collect(Collectors.toList());

        Pagination pagination = Pagination.builder()
                .page(page)
                .size(size)
                .totalPages(addressPage.getTotalPages())
                .totalElements(addressPage.getTotalElements())
                .build();

        return AddressListResponse.builder()
                .addresses(addresses)
                .pagination(pagination)
                .build();
    }

    // We can map Orders similarly if DTOs are accessible, but to avoid circular deps with Order module
    // Let's rely on a basic Page<?> return or a specific AdminOrderListResponse if available.
    // Assuming we could return a generic object or use an existing response
    @GetMapping("/{id}/orders")
    @PreAuthorize("hasAuthority(T(com.nchuy099.SmartPharma.user.enums.RbacPermissions).READ_USER)")
    public Page<OrderEntity> getUserOrders(
            @PathVariable(name = "id") String id,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        log.info("Received get user orders request for admin with id: {}", id);
        UUID userId = UUID.fromString(id);
        Pageable pageable = PageRequest.of(page - 1, size);
        return orderRepository.findByUserId(userId, pageable);
    }
}
