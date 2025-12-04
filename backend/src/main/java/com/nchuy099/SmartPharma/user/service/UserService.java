package com.nchuy099.SmartPharma.user.service;

import java.math.BigDecimal;
import java.util.Collections;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Join;
import java.util.ArrayList;
import com.nchuy099.SmartPharma.user.enums.UserStatus;
import com.nchuy099.SmartPharma.user.enums.RoleType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nchuy099.SmartPharma.common.dto.Pagination;

import com.nchuy099.SmartPharma.media.domain.enums.UploadType;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.service.RbacPolicyService;
import com.nchuy099.SmartPharma.consultation.repository.PrescriptionRepository;
import com.nchuy099.SmartPharma.media.service.MediaService;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.user.entity.PharmacistEntity;
import com.nchuy099.SmartPharma.user.repository.PharmacistRepository;
import com.nchuy099.SmartPharma.catalog.entity.CatalogEntity;
import com.nchuy099.SmartPharma.catalog.entity.CatalogType;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.user.dto.request.ChangePasswordRequest;
import com.nchuy099.SmartPharma.user.dto.request.CreateAddressRequest;
import com.nchuy099.SmartPharma.user.dto.request.CreateUserReq;
import com.nchuy099.SmartPharma.user.dto.request.DeleteAddressRequest;
import com.nchuy099.SmartPharma.user.dto.request.PharmacistUpdateRequest;
import com.nchuy099.SmartPharma.user.dto.request.UpdateAddressRequest;
import com.nchuy099.SmartPharma.user.dto.request.UpdateUserProfileReq;
import com.nchuy099.SmartPharma.user.dto.response.AdminUserListResponse;
import com.nchuy099.SmartPharma.user.dto.response.AdminUserResponse;
import com.nchuy099.SmartPharma.user.dto.request.AdminUpdateUserReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminUpdatePharmacistProfileReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminChangePasswordReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminChangeRoleReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminCreateUserReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminChangeStatusReq;
import com.nchuy099.SmartPharma.user.dto.response.AddressListResponse;
import com.nchuy099.SmartPharma.user.dto.response.AddressResponse;
import com.nchuy099.SmartPharma.user.dto.response.AvatarUploadUrlResp;
import com.nchuy099.SmartPharma.user.dto.response.DeleteAddressResponse;
import com.nchuy099.SmartPharma.user.dto.response.PharmacistResponse;
import com.nchuy099.SmartPharma.user.dto.response.UserProfileResp;
import com.nchuy099.SmartPharma.user.dto.response.CustomerChatProfileResponse;
import com.nchuy099.SmartPharma.user.entity.AddressEntity;
import com.nchuy099.SmartPharma.user.repository.AddressRepository;
import com.nchuy099.SmartPharma.user.entity.AvatarEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.RoleRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtils securityUtils;
    private final MediaService mediaService;
    private final RoleRepository roleRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final PharmacistRepository pharmacistRepository;
    private final CatalogRepository catalogRepository;
    private final ChatConversationRepository chatConversationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final RbacPolicyService rbacPolicyService;

    public String create(CreateUserReq req) {
        log.info("Creating user with email: {}", req.getEmail());
        // Implementation logic to create a user goes here

        Optional<UserEntity> existingUser = this.userRepository.findByEmail(req.getEmail());

        if (existingUser.isPresent()) {
            log.warn("Email is already taken");
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email is already taken");
        }

        RoleEntity userRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND, "Role CUSTOMER not found"));

        var newUser = this.userRepository.save(UserEntity.builder()
                .email(req.getEmail())
                .fullName(req.getFullName())
                .password(passwordEncoder.encode(req.getPassword()))
                .biography(req.getBiography())
                .gender(req.getGender())
                .phoneNumber(req.getPhoneNumber())
                .dateOfBirth(req.getDateOfBirth())
                .role(userRole)
                .build());
        securityUtils.getCurrentUserIdIfPresent().ifPresent(actorId ->
                rbacPolicyService.audit(actorId, "CREATE_USER", "USER",
                        newUser.getId().toString(), null, describeAdminUser(newUser), null));
        return newUser.getId().toString();
    }

    @Transactional
    public AdminUserResponse adminCreateUser(AdminCreateUserReq req) {
        log.info("Admin creating user with email: {} and role: {}", req.getEmail(), req.getRoleName());

        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng");
        }

        String roleName = req.getRoleName() != null ? req.getRoleName().toUpperCase() : "CUSTOMER";
        RoleEntity role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND, "Không tìm thấy quyền: " + roleName));
        rbacPolicyService.validateAdminUserCreation(role);

        UserEntity user = UserEntity.builder()
                .email(req.getEmail())
                .fullName(req.getFullName())
                .password(passwordEncoder.encode(req.getPassword()))
                .biography(req.getBiography())
                .gender(req.getGender())
                .phoneNumber(req.getPhoneNumber())
                .dateOfBirth(req.getDateOfBirth())
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);
        if (isPharmacistRole(role.getName())) {
            ensurePharmacistProfile(user);
        }
        return toAdminUserResponse(user);
    }

    @Transactional(readOnly = true)
    public UserProfileResp getProfile() {
        log.info("Processing Get user profile request");

        UUID id = securityUtils.getCurrentUserId();
        try {
            UserEntity userEntity = userRepository.findByIdWithRolePermissionsAndAvatars(id)
                    .orElseThrow(() -> {
                        log.warn("User not found for profile request. userId={}", id);
                        return new AppException(
                                ErrorCode.USER_NOT_FOUND, "User not found");
                    });

            return toUserProfileResp(userEntity);
        } catch (Exception ex) {
            log.error("Failed to load user profile. userId={}", id, ex);
            throw ex;
        }
    }

    public PharmacistResponse getOwnPharmacistProfile() {
        UUID userId = securityUtils.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (!isPharmacistRole(user.getRole() != null ? user.getRole().getName() : null)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "User is not a pharmacist");
        }

        PharmacistEntity pharmacist = pharmacistRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Pharmacist profile not found for this user"));
        return toPharmacistResponse(user, pharmacist);
    }

    @Transactional
    public PharmacistResponse updateOwnPharmacistProfile(PharmacistUpdateRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (!isPharmacistRole(user.getRole() != null ? user.getRole().getName() : null)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "User is not a pharmacist");
        }

        PharmacistEntity pharmacist = pharmacistRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Pharmacist profile not found for this user"));

        if (req.getQualifications() != null) {
            pharmacist.setQualifications(req.getQualifications());
        }
        if (req.getEducation() != null) {
            pharmacist.setEducation(req.getEducation());
        }
        if (req.getExperience() != null) {
            pharmacist.setExperience(req.getExperience());
        }
        if (req.getSpecialtyCode() != null) {
            CatalogEntity specialty = catalogRepository
                    .findByTypeAndCode(CatalogType.SPECIALTY, req.getSpecialtyCode())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                            "Specialty not found: " + req.getSpecialtyCode()));
            pharmacist.setSpecialty(specialty);
        }

        pharmacist = pharmacistRepository.save(pharmacist);
        return toPharmacistResponse(user, pharmacist);
    }

    public UserProfileResp updateProfile(UpdateUserProfileReq req) {
        log.info("Processing update user profile request");

        UUID id = securityUtils.getCurrentUserId();
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User not found");
                    return new AppException(
                            ErrorCode.USER_NOT_FOUND, "User not found");
                });

        if (req.getEmail() != null && !req.getEmail().equals(userEntity.getEmail())) {

            userRepository.findByEmail(req.getEmail())
                    .orElseThrow(() -> {
                    log.warn("Email is already taken");
                    return new AppException(
                                ErrorCode.EMAIL_ALREADY_EXISTS, "Email is already taken");
                    });
            userEntity.setEmail(req.getEmail());
        }

        if (req.getPhoneNumber() != null) {
            String normalizedPhoneNumber = normalizeOptionalPhoneNumber(req.getPhoneNumber());

            if (normalizedPhoneNumber == null) {
                userEntity.setPhoneNumber(null);
            } else if (!normalizedPhoneNumber.equals(userEntity.getPhoneNumber())) {
                Optional<UserEntity> existingUser = userRepository.findByPhoneNumber(normalizedPhoneNumber);
                if (existingUser.isPresent()) {
                    log.warn("Phone number is already taken");
                    throw new AppException(
                            ErrorCode.PHONE_ALREADY_EXISTS, "Phone number is already taken");
                }
                userEntity.setPhoneNumber(normalizedPhoneNumber);
            }
        }

        if (req.getFullName() != null)
            userEntity.setFullName(req.getFullName());

        if (req.getBiography() != null)
            userEntity.setBiography(req.getBiography());

        if (req.getDateOfBirth() != null)
            userEntity.setDateOfBirth(req.getDateOfBirth());

        if (req.getGender() != null)
            userEntity.setGender(req.getGender());

        if (req.getAvatarUrl() != null) {
            String normalizedAvatarUrl = mediaService.validateAndNormalizeImageUrl(req.getAvatarUrl(), UploadType.AVATAR);

            userEntity.getAvatars().forEach(avatar -> avatar.setActive(false));
            userEntity.getAvatars().add(AvatarEntity.builder()
                    .url(normalizedAvatarUrl)
                    .contentType(mediaService.inferContentTypeFromUrl(normalizedAvatarUrl))
                    .isActive(true)
                    .user(userEntity)
                    .build());
        }

        userRepository.save(userEntity);

        return toUserProfileResp(userEntity);

    }

    @Transactional
    public void changePassword(ChangePasswordRequest req) {
        log.info("Processing change password request");

        UUID id = securityUtils.getCurrentUserId();
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(req.getCurrentPassword(), userEntity.getPassword())) {
            log.warn("Current password does not match for user: {}", id);
            throw new AppException(ErrorCode.UNAUTHORIZED, "Mật khẩu hiện tại không chính xác");
        }

        userEntity.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(userEntity);
        log.info("Password changed successfully for user: {}", id);
    }

    public AvatarUploadUrlResp createAvatarUploadUrl() {
        String userId = securityUtils.getCurrentUserId().toString();
        var presignedUpload = mediaService.createPreSignedUpload(userId, "", "", null, UploadType.AVATAR);

        return AvatarUploadUrlResp.builder()
                .uploadUrl(presignedUpload.getUploadUrl())
                .fileUrl(presignedUpload.getFileUrl())
                .build();
    }

    public AddressResponse getDefaultAddress() {
        log.info("Getting default address for current user");
        UUID userId = securityUtils.getCurrentUserId();
        AddressEntity address = addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND, "Default address not found"));
        return mapToAddressResponse(address);
    }

    public AddressListResponse getAddresses(int page, int size) {
        log.info("Getting addresses for current user with page: {}, size: {}", page, size);
        UUID userId = securityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<AddressEntity> addressPage = addressRepository.findByUserId(userId, pageable);

        List<AddressResponse> addresses = addressPage.getContent().stream()
                .map(this::mapToAddressResponse)
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

    @Transactional
    public AddressResponse createAddress(CreateAddressRequest req) {
        log.info("Creating address for current user");
        UUID userId = securityUtils.getCurrentUserId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(req.getIsDefault())) {
            List<AddressEntity> defaultAddresses = addressRepository.findByUserId(userId).stream()
                    .filter(AddressEntity::getIsDefault)
                    .collect(Collectors.toList());
            defaultAddresses.forEach(addr -> addr.setIsDefault(false));
            addressRepository.saveAll(defaultAddresses);
        }

        AddressEntity address = AddressEntity.builder()
                .fullName(req.getFullName())
                .phoneNumber(req.getPhoneNumber().trim())
                .address(req.getAddress())
                .ghnProvinceId(req.getGhnProvinceId())
                .ghnDistrictId(req.getGhnDistrictId())
                .ghnWardCode(req.getGhnWardCode())
                .provinceName(req.getProvinceName())
                .districtName(req.getDistrictName())
                .wardName(req.getWardName())
                .isDefault(req.getIsDefault() != null ? req.getIsDefault() : false)
                .user(user)
                .build();

        address = addressRepository.save(address);
        return mapToAddressResponse(address);
    }

    @Transactional
    public AddressResponse updateAddress(String id, UpdateAddressRequest req) {
        log.info("Updating address with id: {}", id);
        UUID addressId = UUID.fromString(id);
        UUID userId = securityUtils.getCurrentUserId();

        AddressEntity address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND, "Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (req.getFullName() != null) {
            address.setFullName(req.getFullName());
        }
        if (req.getPhoneNumber() != null) {
            address.setPhoneNumber(req.getPhoneNumber().trim());
        }
        if (req.getAddress() != null) {
            address.setAddress(req.getAddress());
        }
        if (req.getGhnProvinceId() != null) {
            address.setGhnProvinceId(req.getGhnProvinceId());
        }
        if (req.getGhnDistrictId() != null) {
            address.setGhnDistrictId(req.getGhnDistrictId());
        }
        if (req.getGhnWardCode() != null) {
            address.setGhnWardCode(req.getGhnWardCode());
        }
        if (req.getProvinceName() != null) {
            address.setProvinceName(req.getProvinceName());
        }
        if (req.getDistrictName() != null) {
            address.setDistrictName(req.getDistrictName());
        }
        if (req.getWardName() != null) {
            address.setWardName(req.getWardName());
        }
        if (req.getIsDefault() != null) {
            // If setting as default, unset other defaults
            if (Boolean.TRUE.equals(req.getIsDefault())) {
                List<AddressEntity> defaultAddresses = addressRepository.findByUserId(userId).stream()
                        .filter(addr -> !addr.getId().equals(addressId) && addr.getIsDefault())
                        .collect(Collectors.toList());
                defaultAddresses.forEach(addr -> addr.setIsDefault(false));
                addressRepository.saveAll(defaultAddresses);
            }
            address.setIsDefault(req.getIsDefault());
        }

        address = addressRepository.save(address);
        return mapToAddressResponse(address);
    }

    @Transactional
    public DeleteAddressResponse deleteAddress(DeleteAddressRequest req) {
        log.info("Deleting address with id: {}", req.getId());
        UUID addressId = UUID.fromString(req.getId());
        UUID userId = securityUtils.getCurrentUserId();

        AddressEntity address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND, "Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        DeleteAddressResponse response = DeleteAddressResponse.builder()
                .id(address.getId().toString())
                .build();

        addressRepository.delete(address);
        return response;
    }

    private AddressResponse mapToAddressResponse(AddressEntity address) {
        return AddressResponse.builder()
                .id(address.getId().toString())
                .fullName(address.getFullName())
                .phoneNumber(address.getPhoneNumber())
                .address(address.getAddress())
                .ghnProvinceId(address.getGhnProvinceId())
                .ghnDistrictId(address.getGhnDistrictId())
                .ghnWardCode(address.getGhnWardCode())
                .provinceName(address.getProvinceName())
                .districtName(address.getDistrictName())
                .wardName(address.getWardName())
                .fullAddress(formatFullAddress(address))
                .isDefault(address.getIsDefault())
                .build();
    }

    private String formatFullAddress(AddressEntity address) {
        StringBuilder sb = new StringBuilder();
        if (address.getAddress() != null && !address.getAddress().isBlank()) {
            sb.append(address.getAddress());
        }
        if (address.getWardName() != null && !address.getWardName().isBlank()) {
            if (!sb.isEmpty())
                sb.append(", ");
            sb.append(address.getWardName());
        }
        if (address.getDistrictName() != null && !address.getDistrictName().isBlank()) {
            if (!sb.isEmpty())
                sb.append(", ");
            sb.append(address.getDistrictName());
        }
        if (address.getProvinceName() != null && !address.getProvinceName().isBlank()) {
            if (!sb.isEmpty())
                sb.append(", ");
            sb.append(address.getProvinceName());
        }
        return sb.toString();
    }

    public AdminUserListResponse getUserList(int page, int size, String search, String status, String role, String specialty) {
        log.info("Getting user list for admin with page: {}, size: {}, search: {}, status: {}, role: {}, specialty: {}",
                page, size, search, status, role, specialty);

        if (isPharmacistRole(role)) {
            return getPharmacistUserList(page, size, search, status, specialty);
        }

        Pageable pageable = PageRequest.of(page - 1, size);

        Specification<UserEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("fullName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("phoneNumber")), pattern)
                ));
            }

            if (status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status)) {
                try {
                    UserStatus enumStatus = UserStatus.valueOf(status.toUpperCase());
                    predicates.add(cb.equal(root.get("status"), enumStatus));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status filter: {}", status);
                }
            }

            if (role != null && !role.isEmpty() && !"all".equalsIgnoreCase(role)) {
                Join<UserEntity, RoleEntity> roleJoin = root.join("role");
                predicates.add(cb.equal(roleJoin.get("name"), role.toUpperCase(Locale.ROOT)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<UserEntity> userPage = userRepository.findAll(spec, pageable);

        List<AdminUserResponse> users = userPage.getContent().stream()
                .map(this::toAdminUserResponse)
                .collect(Collectors.toList());

        Pagination pagination = Pagination.builder()
                .page(page)
                .size(size)
                .totalPages(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .build();

        return AdminUserListResponse.builder()
                .users(users)
                .pagination(pagination)
                .build();
    }

    public AdminUserListResponse getAdminUserList(int page, int size, String search, String status) {
        log.info("Getting admin user list with page: {}, size: {}, search: {}, status: {}", page, size, search, status);
        Pageable pageable = PageRequest.of(page - 1, size);

        Specification<UserEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<UserEntity, RoleEntity> roleJoin = root.join("role");
            predicates.add(cb.equal(roleJoin.get("roleType"), RoleType.ADMIN));

            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("phoneNumber")), pattern)));
            }

            if (status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status)) {
                try {
                    UserStatus enumStatus = UserStatus.valueOf(status.toUpperCase(Locale.ROOT));
                    predicates.add(cb.equal(root.get("status"), enumStatus));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status filter for admin list: {}", status);
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<UserEntity> userPage = userRepository.findAll(spec, pageable);
        List<AdminUserResponse> users = userPage.getContent().stream()
                .map(this::toAdminUserResponse)
                .collect(Collectors.toList());

        Pagination pagination = Pagination.builder()
                .page(page)
                .size(size)
                .totalPages(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .build();

        return AdminUserListResponse.builder()
                .users(users)
                .pagination(pagination)
                .build();
    }

    public AdminUserResponse getUserDetails(String id) {
        log.info("Getting user details for admin with id: {}", id);
        UUID userId = UUID.fromString(id);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        return toAdminUserResponse(user);
    }

    @Transactional
    public AdminUserResponse adminUpdateUser(String id, AdminUpdateUserReq req) {
        log.info("Admin updating user with id: {}", id);
        UUID userId = UUID.fromString(id);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (isSuperAdminRole(user.getRole() != null ? user.getRole().getName() : null)) {
            UUID currentUserId = securityUtils.getCurrentUserId();
            if (currentUserId == null || !currentUserId.equals(userId)) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Cannot edit SUPER_ADMIN account");
            }
        }

        if (req.getEmail() != null && !req.getEmail().equals(user.getEmail())) {
            if (userRepository.findByEmail(req.getEmail()).isPresent()) {
                throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email is already taken");
            }
            user.setEmail(req.getEmail());
        }

        if (req.getPhoneNumber() != null) {
            String normalizedPhoneNumber = normalizeOptionalPhoneNumber(req.getPhoneNumber());

            if (normalizedPhoneNumber == null) {
                user.setPhoneNumber(null);
            } else if (!normalizedPhoneNumber.equals(user.getPhoneNumber())) {
                if (userRepository.findByPhoneNumber(normalizedPhoneNumber).isPresent()) {
                    throw new AppException(ErrorCode.PHONE_ALREADY_EXISTS, "Phone number is already taken");
                }
                user.setPhoneNumber(normalizedPhoneNumber);
            }
        }

        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getBiography() != null) user.setBiography(req.getBiography());
        if (req.getDateOfBirth() != null) user.setDateOfBirth(req.getDateOfBirth());
        if (req.getGender() != null) user.setGender(req.getGender());

        user = userRepository.save(user);
        return toAdminUserResponse(user);
    }

    @Transactional
    public AdminUserResponse adminUpdatePharmacistProfile(String id, AdminUpdatePharmacistProfileReq req) {
        log.info("Admin updating pharmacist profile for user id: {}", id);
        UUID userId = UUID.fromString(id);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (!isPharmacistRole(user.getRole() != null ? user.getRole().getName() : null)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "User is not a pharmacist");
        }

        upsertPharmacistProfile(user, req.getQualifications(), req.getEducation(), req.getExperience(),
                req.getSpecialtyCode(), req.getIsApproved());
        return toAdminUserResponse(user);
    }

    @Transactional
    public void adminResetPassword(String id, AdminChangePasswordReq req) {
        log.info("Admin resetting password for user with id: {}", id);
        UUID userId = UUID.fromString(id);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (isSuperAdminRole(user.getRole() != null ? user.getRole().getName() : null)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot change SUPER_ADMIN account");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public AdminUserResponse adminChangeRole(String id, AdminChangeRoleReq req) {
        log.info("Admin changing role for user with id: {}", id);
        UUID userId = UUID.fromString(id);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        RoleEntity role = roleRepository.findByName(req.getRoleName())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND, "Role not found"));
        String beforeState = describeAdminUser(user);
        rbacPolicyService.validateRoleChange(user, role);

        user.setRole(role);
        user = userRepository.save(user);
        rbacPolicyService.audit(securityUtils.getCurrentUserId(), "CHANGE_USER_ROLE", "USER",
                user.getId().toString(), beforeState, describeAdminUser(user), null);
        return toAdminUserResponse(user);
    }

    @Transactional
    public AdminUserResponse adminChangeStatus(String id, AdminChangeStatusReq req) {
        log.info("Admin changing status for user with id: {}", id);
        UUID userId = UUID.fromString(id);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (isSuperAdminRole(user.getRole() != null ? user.getRole().getName() : null)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot change SUPER_ADMIN account");
        }

        user.setStatus(req.getStatus());
        user = userRepository.save(user);
        return toAdminUserResponse(user);
    }

    private AdminUserResponse toAdminUserResponse(UserEntity user) {
        PharmacistEntity pharmacist = null;
        String specialtyCode = null;
        String specialtyName = null;
        String qualifications = null;
        String education = null;
        String experience = null;
        Boolean isApproved = null;
        Integer activeSessions = null;
        Long totalConsultations = null;
        BigDecimal profit = null;

        if (isPharmacistRole(user.getRole() != null ? user.getRole().getName() : null)) {
            pharmacist = pharmacistRepository.findByUserId(user.getId()).orElse(null);
            if (pharmacist != null) {
                qualifications = pharmacist.getQualifications();
                education = pharmacist.getEducation();
                experience = pharmacist.getExperience();
                isApproved = Boolean.TRUE.equals(pharmacist.getIsApproved());
                if (pharmacist.getSpecialty() != null) {
                    specialtyCode = pharmacist.getSpecialty().getCode();
                    specialtyName = pharmacist.getSpecialty().getName();
                }

                activeSessions = (int) chatConversationRepository
                        .findByPharmacistIdOrderByUpdatedAtDesc(pharmacist.getId())
                        .stream()
                        .filter(r -> "ACTIVE".equals(r.getStatus()))
                        .count();
                totalConsultations = chatConversationRepository.countByPharmacistId(pharmacist.getId());

                List<UUID> consultedCustomerIds = prescriptionRepository.findDistinctCustomerIdsByPharmacistId(user.getId());
                if (!consultedCustomerIds.isEmpty()) {
                    profit = orderRepository.sumDeliveredFinalAmountByUserIds(consultedCustomerIds);
                } else {
                    profit = BigDecimal.ZERO;
                }
            }
        }

        return AdminUserResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .roleType(user.getRole() != null && user.getRole().getRoleType() != null
                        ? user.getRole().getRoleType().name() : null)
                .roleProtected(user.getRole() != null ? user.getRole().getProtectedRole() : null)
                .roleDescription(user.getRole() != null ? user.getRole().getDescription() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .avatarUrl(user.getAvatars() != null ? user.getAvatars().stream()
                        .filter(AvatarEntity::isActive)
                        .map(AvatarEntity::getUrl)
                        .findFirst()
                        .orElse(null) : null)
                .qualifications(qualifications)
                .education(education)
                .experience(experience)
                .specialtyCode(specialtyCode)
                .specialtyName(specialtyName)
                .isApproved(isApproved)
                .activeSessions(activeSessions)
                .totalConsultations(totalConsultations)
                .profit(profit)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminUserListResponse getPharmacistUserList(int page, int size, String search, String status, String specialty) {
        RoleEntity pharmacistRole = roleRepository.findByName("PHARMACIST")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND, "Role PHARMACIST not found"));

        List<AdminUserResponse> allResponses = userRepository.findByRole(pharmacistRole).stream()
                .map(this::toAdminUserResponse)
                .filter(response -> matchesPharmacistSearch(response, search))
                .filter(response -> matchesPharmacistSpecialty(response, specialty))
                .toList();

        long totalApproved = allResponses.stream().filter(p -> Boolean.TRUE.equals(p.getIsApproved())).count();
        long totalPending = allResponses.stream().filter(p -> !Boolean.TRUE.equals(p.getIsApproved())).count();

        List<AdminUserResponse> filteredResponses = allResponses;
        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
            String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
            filteredResponses = allResponses.stream()
                    .filter(p -> getPharmacistApprovalStatus(p).equals(normalizedStatus))
                    .toList();
        }

        int totalElements = filteredResponses.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.max(0, (page - 1) * size);
        int toIndex = Math.min(fromIndex + size, totalElements);

        List<AdminUserResponse> pagedUsers = fromIndex >= totalElements
                ? Collections.emptyList()
                : filteredResponses.subList(fromIndex, toIndex);

        Pagination pagination = Pagination.builder()
                .page(page)
                .size(size)
                .totalPages(totalPages)
                .totalElements((long) totalElements)
                .build();

        return AdminUserListResponse.builder()
                .users(pagedUsers)
                .pagination(pagination)
                .build();
    }

    private boolean matchesPharmacistSearch(AdminUserResponse response, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String keyword = search.trim().toLowerCase(Locale.ROOT);
        return (response.getFullName() != null && response.getFullName().toLowerCase(Locale.ROOT).contains(keyword))
                || (response.getEmail() != null && response.getEmail().toLowerCase(Locale.ROOT).contains(keyword))
                || (response.getPhoneNumber() != null && response.getPhoneNumber().toLowerCase(Locale.ROOT).contains(keyword));
    }

    private boolean matchesPharmacistSpecialty(AdminUserResponse response, String specialtyCode) {
        if (specialtyCode == null || specialtyCode.isBlank()) {
            return true;
        }
        return specialtyCode.equalsIgnoreCase(response.getSpecialtyCode());
    }

    private String getPharmacistApprovalStatus(AdminUserResponse response) {
        return Boolean.TRUE.equals(response.getIsApproved()) ? "APPROVED" : "PENDING";
    }

    private boolean isPharmacistRole(String roleName) {
        return roleName != null && "PHARMACIST".equalsIgnoreCase(roleName.trim());
    }

    private boolean isSuperAdminRole(String roleName) {
        return roleName != null && "SUPER_ADMIN".equalsIgnoreCase(roleName.trim());
    }

    private String normalizeOptionalPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return null;
        }

        String normalized = phoneNumber.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String describeAdminUser(UserEntity user) {
        return user.getEmail() + "|" + (user.getRole() != null ? user.getRole().getName() : "NONE");
    }

    private void ensurePharmacistProfile(UserEntity user) {
        pharmacistRepository.findByUserId(user.getId())
                .orElseGet(() -> pharmacistRepository.save(PharmacistEntity.builder()
                        .user(user)
                        .isApproved(false)
                        .build()));
    }

    private void upsertPharmacistProfile(
            UserEntity user,
            String qualifications,
            String education,
            String experience,
            String specialtyCode,
            Boolean isApproved) {
        PharmacistEntity pharmacist = pharmacistRepository.findByUserId(user.getId())
                .orElseGet(() -> PharmacistEntity.builder()
                        .user(user)
                        .isApproved(false)
                        .build());

        if (qualifications != null) {
            pharmacist.setQualifications(qualifications);
        }
        if (education != null) {
            pharmacist.setEducation(education);
        }
        if (experience != null) {
            pharmacist.setExperience(experience);
        }
        if (specialtyCode != null) {
            CatalogEntity specialty = catalogRepository
                    .findByTypeAndCode(CatalogType.SPECIALTY, specialtyCode)
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Specialty not found: " + specialtyCode));
            pharmacist.setSpecialty(specialty);
        }

        if (Boolean.TRUE.equals(isApproved) && !isProfileCompleteForApproval(pharmacist)) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Cannot approve pharmacist without specialty and education");
        }
        if (isApproved != null) {
            pharmacist.setIsApproved(isApproved);
        }

        pharmacistRepository.save(pharmacist);
    }

    private boolean isProfileCompleteForApproval(PharmacistEntity pharmacist) {
        return pharmacist.getSpecialty() != null
                && pharmacist.getEducation() != null
                && !pharmacist.getEducation().isBlank();
    }

    public CustomerChatProfileResponse getCustomerChatProfile(String userId) {
        log.info("Getting customer chat profile for user: {}", userId);

        if ("anonymous".equals(userId)) {
            return CustomerChatProfileResponse.builder()
                    .fullName("Khách vãng lai")
                    .age(0)
                    .gender("N/A")
                    .allergies("Khách vãng lai không có thông tin tiểu sử")
                    .recentDrugs(List.of())
                    .build();
        }

        UUID id;
        try {
            id = UUID.fromString(userId);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid user id format: {}", userId);
            return CustomerChatProfileResponse.builder()
                    .fullName("Khách hàng")
                    .age(0)
                    .gender("N/A")
                    .recentDrugs(List.of())
                    .build();
        }

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        int age = 0;
        if (user.getDateOfBirth() != null) {
            age = Period.between(user.getDateOfBirth(), LocalDate.now()).getYears();
        }

        // Fetch last 10 items to find distinct products
        List<String> recentDrugs = orderRepository.findByUserId(id, PageRequest.of(0, 10))
                .getContent().stream()
                .flatMap(order -> order.getItems().stream())
                .filter(item -> item.getProduct() != null)
                .map(item -> item.getProduct().getName())
                .distinct()
                .limit(5)
                .collect(Collectors.toList());

        return CustomerChatProfileResponse.builder()
                .fullName(user.getFullName())
                .age(age)
                .gender(user.getGender())
                .allergies("Chưa có thông tin")
                .recentDrugs(recentDrugs)
                .build();
    }

    private UserProfileResp toUserProfileResp(UserEntity userEntity) {
        return UserProfileResp.builder()
                .userId(userEntity.getId().toString())
                .email(userEntity.getEmail())
                .biography(userEntity.getBiography())
                .avatarUrl(userEntity.getAvatars() != null
                        ? userEntity.getAvatars().stream()
                                .filter(AvatarEntity::isActive)
                                .map(AvatarEntity::getUrl)
                                .findFirst()
                                .orElse(null)
                        : null)
                .fullName(userEntity.getFullName())
                .dateOfBirth(userEntity.getDateOfBirth())
                .gender(userEntity.getGender())
                .phoneNumber(userEntity.getPhoneNumber())
                .build();
    }

    private PharmacistResponse toPharmacistResponse(UserEntity user, PharmacistEntity pharmacist) {
        String specialtyCode = null;
        String specialtyName = null;

        if (pharmacist.getSpecialty() != null) {
            specialtyCode = pharmacist.getSpecialty().getCode();
            specialtyName = pharmacist.getSpecialty().getName();
        }

        int activeSessions = 0;
        long totalConsultations = 0;
        BigDecimal profit = BigDecimal.ZERO;
        if (pharmacist.getId() != null) {
            activeSessions = (int) chatConversationRepository.findByPharmacistIdOrderByUpdatedAtDesc(pharmacist.getId())
                    .stream()
                    .filter(r -> "ACTIVE".equals(r.getStatus()))
                    .count();
            totalConsultations = chatConversationRepository.countByPharmacistId(pharmacist.getId());

            List<UUID> consultedCustomerIds = prescriptionRepository.findDistinctCustomerIdsByPharmacistId(user.getId());
            if (!consultedCustomerIds.isEmpty()) {
                profit = orderRepository.sumDeliveredFinalAmountByUserIds(consultedCustomerIds);
            }
        }

        return PharmacistResponse.builder()
                .id(pharmacist.getId() != null ? pharmacist.getId().toString() : user.getId().toString())
                .userId(user.getId().toString())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatars() != null ? user.getAvatars().stream()
                        .filter(AvatarEntity::isActive)
                        .map(AvatarEntity::getUrl)
                        .findFirst()
                        .orElse(null) : null)
                .qualifications(pharmacist.getQualifications())
                .education(pharmacist.getEducation())
                .experience(pharmacist.getExperience())
                .specialtyCode(specialtyCode)
                .specialtyName(specialtyName)
                .isApproved(Boolean.TRUE.equals(pharmacist.getIsApproved()))
                .activeSessions(activeSessions)
                .rating(null)
                .totalConsultations(totalConsultations)
                .profit(profit)
                .createdAt(pharmacist.getCreatedAt())
                .build();
    }

}
