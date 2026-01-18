package com.nchuy099.SmartPharma.user.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.media.service.MediaService;
import com.nchuy099.SmartPharma.order.domain.repository.OrderRepository;
import com.nchuy099.SmartPharma.user.dto.request.AdminCreateUserReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminChangePasswordReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminChangeStatusReq;
import com.nchuy099.SmartPharma.user.dto.request.AdminUpdateUserReq;
import com.nchuy099.SmartPharma.user.dto.request.UpdateUserProfileReq;
import com.nchuy099.SmartPharma.user.dto.response.AdminUserResponse;
import com.nchuy099.SmartPharma.user.dto.response.UserProfileResp;
import com.nchuy099.SmartPharma.user.entity.AvatarEntity;
import com.nchuy099.SmartPharma.user.entity.PharmacistEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.enums.RoleType;
import com.nchuy099.SmartPharma.user.enums.UserStatus;
import com.nchuy099.SmartPharma.user.repository.PharmacistRepository;
import com.nchuy099.SmartPharma.catalog.repository.CatalogRepository;
import com.nchuy099.SmartPharma.chat.repository.ChatConversationRepository;
import com.nchuy099.SmartPharma.consultation.repository.PrescriptionRepository;
import com.nchuy099.SmartPharma.user.repository.AddressRepository;
import com.nchuy099.SmartPharma.user.repository.RbacAuditLogRepository;
import com.nchuy099.SmartPharma.user.repository.RoleRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import com.nchuy099.SmartPharma.user.service.RbacPolicyService;

class UserServiceTest {

    private UserRepository userRepository;
    private SecurityUtils securityUtils;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        securityUtils = mock(SecurityUtils.class);

        MediaService mediaService = new MediaService(
                securityUtils,
                mock(com.nchuy099.SmartPharma.user.repository.UserRepository.class),
                mock(software.amazon.awssdk.services.s3.presigner.S3Presigner.class));
        ReflectionTestUtils.setField(mediaService, "bucket", "smartpharma-bucket");
        ReflectionTestUtils.setField(mediaService, "region", "ap-southeast-1");

        userService = new UserService(userRepository, mock(org.springframework.security.crypto.password.PasswordEncoder.class),
                securityUtils, mediaService, mock(RoleRepository.class), mock(AddressRepository.class),
                mock(OrderRepository.class), mock(PharmacistRepository.class), mock(CatalogRepository.class),
                mock(ChatConversationRepository.class), mock(PrescriptionRepository.class), mock(RbacPolicyService.class));
    }

    @Test
    void updateProfileShouldRejectExternalAvatarUrl() {
        UUID userId = UUID.randomUUID();
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(existingUser(userId)));

        UpdateUserProfileReq request = UpdateUserProfileReq.builder()
                .avatarUrl("https://example.com/avatar.png")
                .build();

        AppException exception = assertThrows(AppException.class, () -> userService.updateProfile(request));

        assertEquals("Avatar URL is invalid", exception.getMessage());
    }

    @Test
    void updateProfileShouldPersistValidAvatarAndDeactivateOldOnes() {
        UUID userId = UUID.randomUUID();
        UserEntity user = existingUser(userId);
        user.getAvatars().add(AvatarEntity.builder()
                .url("https://smartpharma-bucket.s3.ap-southeast-1.amazonaws.com/images/avatars/original/user-1/old.jpeg")
                .contentType("image/jpeg")
                .isActive(true)
                .user(user)
                .build());

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        String newAvatarUrl = "https://smartpharma-bucket.s3.ap-southeast-1.amazonaws.com/images/avatars/original/user-1/new.jpeg";
        UpdateUserProfileReq request = UpdateUserProfileReq.builder()
                .avatarUrl(newAvatarUrl)
                .build();

        userService.updateProfile(request);

        long activeCount = user.getAvatars().stream().filter(AvatarEntity::isActive).count();
        assertEquals(1L, activeCount);
        assertEquals(newAvatarUrl, user.getAvatars().stream().filter(AvatarEntity::isActive).findFirst().orElseThrow().getUrl());
    }

    @Test
    void updateProfileShouldAllowBlankPhoneNumberAndClearExistingValue() {
        UUID userId = UUID.randomUUID();
        UserEntity user = existingUser(userId);
        user.setPhoneNumber("0901234567");

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UpdateUserProfileReq request = UpdateUserProfileReq.builder()
                .phoneNumber("")
                .build();

        userService.updateProfile(request);

        assertEquals(null, user.getPhoneNumber());
    }

    @Test
    void adminCreateUserShouldRejectSuperAdminRole() {
        UUID actorId = UUID.randomUUID();
        UUID targetRoleId = UUID.randomUUID();
        RoleEntity actorRole = RoleEntity.builder()
                .name("STAFF")
                .roleType(RoleType.ADMIN)
                .permissions(new java.util.HashSet<>())
                .build();
        actorRole.setId(UUID.randomUUID());

        RoleEntity superAdminRole = RoleEntity.builder()
                .name("SUPER_ADMIN")
                .roleType(RoleType.ADMIN)
                .permissions(new java.util.HashSet<>())
                .build();
        superAdminRole.setId(targetRoleId);

        UserEntity actor = existingUser(actorId);
        actor.setRole(actorRole);

        RoleRepository roleRepository = mock(RoleRepository.class);
        when(securityUtils.getCurrentUserId()).thenReturn(actorId);
        when(userRepository.findByIdWithRolePermissions(actorId)).thenReturn(Optional.of(actor));
        when(roleRepository.findByName("SUPER_ADMIN")).thenReturn(Optional.of(superAdminRole));

        RbacPolicyService policyService = new RbacPolicyService(userRepository, mock(RbacAuditLogRepository.class), securityUtils);
        userService = new UserService(userRepository, mock(org.springframework.security.crypto.password.PasswordEncoder.class),
                securityUtils, mock(MediaService.class), roleRepository, mock(AddressRepository.class),
                mock(OrderRepository.class), mock(PharmacistRepository.class), mock(CatalogRepository.class),
                mock(ChatConversationRepository.class), mock(PrescriptionRepository.class), policyService);

        AdminCreateUserReq request = AdminCreateUserReq.builder()
                .email("new.admin@example.com")
                .fullName("New Admin")
                .password("password123")
                .roleName("SUPER_ADMIN")
                .build();

        AppException exception = assertThrows(AppException.class, () -> userService.adminCreateUser(request));
        assertEquals("Cannot assign SUPER_ADMIN role", exception.getMessage());
    }

    @Test
    void adminCreateUserShouldAllowNonSuperAdminRoles() {
        UUID actorId = UUID.randomUUID();
        UUID savedUserId = UUID.randomUUID();

        RoleEntity actorRole = RoleEntity.builder()
                .name("STAFF")
                .roleType(RoleType.ADMIN)
                .permissions(new java.util.HashSet<>())
                .build();
        actorRole.setId(UUID.randomUUID());

        RoleEntity pharmacistRole = RoleEntity.builder()
                .name("PHARMACIST")
                .roleType(RoleType.PHARMACIST)
                .permissions(new java.util.HashSet<>())
                .build();
        pharmacistRole.setId(UUID.randomUUID());

        UserEntity actor = existingUser(actorId);
        actor.setRole(actorRole);

        RoleRepository roleRepository = mock(RoleRepository.class);
        org.springframework.security.crypto.password.PasswordEncoder passwordEncoder =
                mock(org.springframework.security.crypto.password.PasswordEncoder.class);
        PharmacistRepository pharmacistRepository = mock(PharmacistRepository.class);

        when(securityUtils.getCurrentUserId()).thenReturn(actorId);
        when(userRepository.findByIdWithRolePermissions(actorId)).thenReturn(Optional.of(actor));
        when(userRepository.findByEmail("new.pharmacist@example.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName("PHARMACIST")).thenReturn(Optional.of(pharmacistRole));
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(pharmacistRepository.findByUserId(savedUserId)).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(invocation -> {
            UserEntity saved = invocation.getArgument(0);
            saved.setId(savedUserId);
            return saved;
        });
        when(pharmacistRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        RbacPolicyService policyService = new RbacPolicyService(userRepository, mock(RbacAuditLogRepository.class), securityUtils);
        userService = new UserService(userRepository, passwordEncoder,
                securityUtils, mock(MediaService.class), roleRepository, mock(AddressRepository.class),
                mock(OrderRepository.class), pharmacistRepository, mock(CatalogRepository.class),
                mock(ChatConversationRepository.class), mock(PrescriptionRepository.class), policyService);

        AdminCreateUserReq request = AdminCreateUserReq.builder()
                .email("new.pharmacist@example.com")
                .fullName("New Pharmacist")
                .password("password123")
                .roleName("PHARMACIST")
                .build();

        AdminUserResponse response = userService.adminCreateUser(request);

        assertEquals("PHARMACIST", response.getRole());
        assertEquals("PHARMACIST", response.getRoleType());
        assertEquals("New Pharmacist", response.getFullName());
    }

    @Test
    void adminResetPasswordShouldRejectSuperAdminAccount() {
        UUID userId = UUID.randomUUID();
        UserEntity user = existingUser(userId);
        user.setRole(role("SUPER_ADMIN", RoleType.ADMIN));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        AppException exception = assertThrows(AppException.class, () ->
                userService.adminResetPassword(userId.toString(), AdminChangePasswordReq.builder().newPassword("newpass").build()));

        assertEquals("Cannot change SUPER_ADMIN account", exception.getMessage());
    }

    @Test
    void adminChangeStatusShouldRejectSuperAdminAccount() {
        UUID userId = UUID.randomUUID();
        UserEntity user = existingUser(userId);
        user.setRole(role("SUPER_ADMIN", RoleType.ADMIN));
        user.setStatus(UserStatus.ACTIVE);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        AppException exception = assertThrows(AppException.class, () ->
                userService.adminChangeStatus(userId.toString(), AdminChangeStatusReq.builder().status(UserStatus.SUSPENDED).build()));

        assertEquals("Cannot change SUPER_ADMIN account", exception.getMessage());
    }

    @Test
    void adminUpdateUserShouldRejectEditingOtherSuperAdminAccount() {
        UUID actorId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        UserEntity target = existingUser(targetId);
        target.setRole(role("SUPER_ADMIN", RoleType.ADMIN));

        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));
        when(securityUtils.getCurrentUserId()).thenReturn(actorId);

        AppException exception = assertThrows(AppException.class, () ->
                userService.adminUpdateUser(targetId.toString(), AdminUpdateUserReq.builder()
                        .fullName("New Name")
                        .build()));

        assertEquals("Cannot edit SUPER_ADMIN account", exception.getMessage());
    }

    @Test
    void adminUpdateUserShouldAllowEditingOwnSuperAdminAccount() {
        UUID userId = UUID.randomUUID();
        UserEntity user = existingUser(userId);
        user.setRole(role("SUPER_ADMIN", RoleType.ADMIN));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.save(user)).thenReturn(user);

        AdminUserResponse response = userService.adminUpdateUser(userId.toString(), AdminUpdateUserReq.builder()
                .fullName("Updated Name")
                .build());

        assertEquals("Updated Name", response.getFullName());
    }

    @Test
    void adminUpdateUserShouldAllowBlankPhoneNumberAndClearExistingValue() {
        UUID userId = UUID.randomUUID();
        UserEntity user = existingUser(userId);
        user.setPhoneNumber("0901234567");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.save(user)).thenReturn(user);

        AdminUserResponse response = userService.adminUpdateUser(userId.toString(), AdminUpdateUserReq.builder()
                .phoneNumber("")
                .build());

        assertEquals(null, response.getPhoneNumber());
    }

    @Test
    void getProfileShouldLoadAvatarsAndMapUserId() {
        UUID userId = UUID.randomUUID();
        UserEntity user = existingUser(userId);
        user.getAvatars().add(AvatarEntity.builder()
                .url("https://cdn.example/avatar.jpg")
                .contentType("image/jpeg")
                .isActive(true)
                .user(user)
                .build());

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findByIdWithRolePermissionsAndAvatars(userId)).thenReturn(Optional.of(user));

        UserProfileResp response = userService.getProfile();

        assertEquals(userId.toString(), response.getUserId());
        assertEquals("https://cdn.example/avatar.jpg", response.getAvatarUrl());
    }

    private UserEntity existingUser(UUID userId) {
        UserEntity user = UserEntity.builder()
                .email("admin@example.com")
                .fullName("Admin User")
                .avatars(new java.util.ArrayList<>())
                .build();
        user.setId(userId);
        return user;
    }

    private RoleEntity role(String name, RoleType type) {
        RoleEntity role = RoleEntity.builder()
                .name(name)
                .roleType(type)
                .permissions(new java.util.HashSet<>())
                .build();
        role.setId(UUID.randomUUID());
        return role;
    }
}
