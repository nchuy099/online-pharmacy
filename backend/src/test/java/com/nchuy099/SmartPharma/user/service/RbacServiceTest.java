package com.nchuy099.SmartPharma.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import com.nchuy099.SmartPharma.user.dto.request.CreateRoleRequest;
import com.nchuy099.SmartPharma.user.dto.request.UpdateRolePermissionsRequest;
import com.nchuy099.SmartPharma.user.enums.RoleType;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.entity.PermissionEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.PermissionRepository;
import com.nchuy099.SmartPharma.user.repository.RoleRepository;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class RbacServiceTest {

    @Test
    void getCurrentUserRole_shouldReturnRoleTypeOnly() {
        RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        PermissionRepository permissionRepository = org.mockito.Mockito.mock(PermissionRepository.class);
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = org.mockito.Mockito.mock(RbacPolicyService.class);
        RbacService service = new RbacService(roleRepository, permissionRepository, userRepository, securityUtils, policyService);

        UUID userId = UUID.randomUUID();
        UserEntity user = UserEntity.builder()
                .role(role("CUSTOMER", RoleType.CUSTOMER, true))
                .build();

        when(securityUtils.getCurrentUserId()).thenReturn(userId);
        when(userRepository.findByIdWithRolePermissions(userId)).thenReturn(Optional.of(user));

        var response = service.getCurrentUserRole();

        assertThat(response.getRoleType()).isEqualTo(RoleType.CUSTOMER);
    }

    @Test
    void updateRolePermissions_shouldReplaceRolePermissions() {
        RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        PermissionRepository permissionRepository = org.mockito.Mockito.mock(PermissionRepository.class);
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = org.mockito.Mockito.mock(RbacPolicyService.class);
        RbacService service = new RbacService(roleRepository, permissionRepository, userRepository, securityUtils, policyService);

        UUID roleId = UUID.randomUUID();
        UUID readId = UUID.randomUUID();
        UUID createId = UUID.randomUUID();
        RoleEntity role = RoleEntity.builder()
                .name("STAFF")
                .permissions(new java.util.HashSet<>())
                .build();
        role.setId(roleId);
        PermissionEntity read = PermissionEntity.builder().name("READ_PRODUCT").build();
        read.setId(readId);
        PermissionEntity create = PermissionEntity.builder().name("CREATE_PRODUCT").build();
        create.setId(createId);

        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));
        when(permissionRepository.findByNameIgnoreCase("READ_PRODUCT")).thenReturn(Optional.of(read));
        when(permissionRepository.findByNameIgnoreCase("CREATE_PRODUCT")).thenReturn(Optional.of(create));
        when(roleRepository.save(any(RoleEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(securityUtils.getCurrentUserId()).thenReturn(UUID.randomUUID());
        doNothing().when(policyService).ensureRoleIsEditable(any(RoleEntity.class));
        doNothing().when(policyService).validateRolePermissionUpdate(any(RoleEntity.class), any(), any());
        when(policyService.buildValidatedRolePermissions(any(RoleEntity.class), any(), any())).thenAnswer(invocation -> new java.util.LinkedHashSet<>((java.util.Collection<PermissionEntity>) invocation.getArgument(2)));
        when(policyService.getCurrentActor()).thenReturn(UserEntity.builder().build());

        var response = service.updateRolePermissions(roleId, UpdateRolePermissionsRequest.builder()
                .permissionNames(List.of("read_product", "CREATE_PRODUCT", "CREATE_PRODUCT"))
                .build());

        assertThat(response.getName()).isEqualTo("STAFF");
        assertThat(response.getPermissions()).extracting("name")
                .containsExactlyInAnyOrder("READ_PRODUCT", "CREATE_PRODUCT");
        verify(roleRepository).save(role);
    }

    @Test
    void getRoles_shouldIncludeSuperAdminForRbacScreen() {
        RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        PermissionRepository permissionRepository = org.mockito.Mockito.mock(PermissionRepository.class);
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = org.mockito.Mockito.mock(RbacPolicyService.class);
        RbacService service = new RbacService(roleRepository, permissionRepository, userRepository, securityUtils, policyService);

        RoleEntity superAdmin = role("SUPER_ADMIN", RoleType.ADMIN, true);
        RoleEntity staff = role("STAFF", RoleType.ADMIN, false);

        when(roleRepository.findAll(any(Sort.class))).thenReturn(List.of(superAdmin, staff));

        var roles = service.getRoles();

        assertThat(roles).extracting("name").containsExactly("SUPER_ADMIN", "STAFF");
    }

    @Test
    void getRoleOptions_shouldExcludeSuperAdminAndPermissions() {
        RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        PermissionRepository permissionRepository = org.mockito.Mockito.mock(PermissionRepository.class);
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = org.mockito.Mockito.mock(RbacPolicyService.class);
        RbacService service = new RbacService(roleRepository, permissionRepository, userRepository, securityUtils, policyService);

        RoleEntity superAdmin = role("SUPER_ADMIN", RoleType.ADMIN, true);
        RoleEntity staff = role("STAFF", RoleType.ADMIN, false);
        staff.getPermissions().add(PermissionEntity.builder().name("READ_PRODUCT").build());

        when(roleRepository.findAll(any(Sort.class))).thenReturn(List.of(superAdmin, staff));

        var roles = service.getRoleOptions();

        assertThat(roles).extracting("name").containsExactly("STAFF");
    }

    @Test
    void getRoleSummaries_shouldReturnCountsAndExcludePermissionPayload() {
        RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        PermissionRepository permissionRepository = org.mockito.Mockito.mock(PermissionRepository.class);
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = org.mockito.Mockito.mock(RbacPolicyService.class);
        RbacService service = new RbacService(roleRepository, permissionRepository, userRepository, securityUtils, policyService);

        RoleEntity staff = role("STAFF", RoleType.ADMIN, false);
        staff.getPermissions().add(PermissionEntity.builder().name("READ_PRODUCT").build());
        RoleEntity admin = role("SUPER_ADMIN", RoleType.ADMIN, true);

        UserRepository.UserRoleCountProjection staffCount = org.mockito.Mockito.mock(UserRepository.UserRoleCountProjection.class);
        when(staffCount.getRoleName()).thenReturn("STAFF");
        when(staffCount.getTotal()).thenReturn(3L);
        when(userRepository.countUsersByRole()).thenReturn(List.of(staffCount));
        when(roleRepository.findAll(any(Sort.class))).thenReturn(List.of(admin, staff));

        var summaries = service.getRoleSummaries();

        assertThat(summaries).extracting("name").containsExactly("SUPER_ADMIN", "STAFF");
        assertThat(summaries.get(1).getPermissionCount()).isEqualTo(1L);
        assertThat(summaries.get(1).getUserCount()).isEqualTo(3L);
    }

    @Test
    void getAdminRoleSummaries_shouldOnlyReturnAdminRoles() {
        RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        PermissionRepository permissionRepository = org.mockito.Mockito.mock(PermissionRepository.class);
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = org.mockito.Mockito.mock(RbacPolicyService.class);
        RbacService service = new RbacService(roleRepository, permissionRepository, userRepository, securityUtils, policyService);

        RoleEntity superAdmin = role("SUPER_ADMIN", RoleType.ADMIN, true);
        RoleEntity staff = role("STAFF", RoleType.ADMIN, false);
        when(roleRepository.findByRoleType(org.mockito.ArgumentMatchers.eq(RoleType.ADMIN), any(Sort.class)))
                .thenReturn(List.of(superAdmin, staff));
        when(userRepository.countUsersByRole()).thenReturn(List.of());

        var summaries = service.getAdminRoleSummaries();

        assertThat(summaries).extracting("name").containsExactly("SUPER_ADMIN", "STAFF");
    }

    @Test
    void getAdminRoleOptions_shouldExcludeSuperAdmin() {
        RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        PermissionRepository permissionRepository = org.mockito.Mockito.mock(PermissionRepository.class);
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = org.mockito.Mockito.mock(RbacPolicyService.class);
        RbacService service = new RbacService(roleRepository, permissionRepository, userRepository, securityUtils, policyService);

        RoleEntity superAdmin = role("SUPER_ADMIN", RoleType.ADMIN, true);
        RoleEntity staff = role("STAFF", RoleType.ADMIN, false);
        RoleEntity customer = role("CUSTOMER", RoleType.CUSTOMER, false);
        RoleEntity pharmacist = role("PHARMACIST", RoleType.PHARMACIST, false);
        RoleEntity guest = role("GUEST", RoleType.CUSTOMER, false);
        when(roleRepository.findAll(any(Sort.class)))
                .thenReturn(List.of(superAdmin, staff, customer, pharmacist, guest));

        var roles = service.getAdminRoleOptions();

        assertThat(roles).extracting("name")
                .containsExactly("STAFF", "CUSTOMER", "PHARMACIST", "GUEST");
    }

    @Test
    void createRole_shouldNormalizeAndPersistRole() {
        RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        PermissionRepository permissionRepository = org.mockito.Mockito.mock(PermissionRepository.class);
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = org.mockito.Mockito.mock(RbacPolicyService.class);
        RbacService service = new RbacService(roleRepository, permissionRepository, userRepository, securityUtils, policyService);

        RoleEntity actorRole = role("SUPER_ADMIN", RoleType.ADMIN, true);
        UserEntity actor = UserEntity.builder().role(actorRole).build();
        actor.setId(UUID.randomUUID());

        when(roleRepository.findByNameIgnoreCase("CONTENT_MANAGER")).thenReturn(Optional.empty());
        when(roleRepository.save(any(RoleEntity.class))).thenAnswer(invocation -> {
            RoleEntity saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        doNothing().when(policyService).validateRoleCreation(any());
        when(policyService.getCurrentActor()).thenReturn(actor);

        var response = service.createRole(CreateRoleRequest.builder()
                .name("content_manager")
                .description("Manages content")
                .roleType(RoleType.ADMIN)
                .build());

        assertThat(response.getName()).isEqualTo("CONTENT_MANAGER");
        verify(roleRepository).save(any(RoleEntity.class));
    }

    @Test
    void deleteRole_shouldDeleteUnassignedRole() {
        RoleRepository roleRepository = org.mockito.Mockito.mock(RoleRepository.class);
        PermissionRepository permissionRepository = org.mockito.Mockito.mock(PermissionRepository.class);
        UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
        SecurityUtils securityUtils = org.mockito.Mockito.mock(SecurityUtils.class);
        RbacPolicyService policyService = org.mockito.Mockito.mock(RbacPolicyService.class);
        RbacService service = new RbacService(roleRepository, permissionRepository, userRepository, securityUtils, policyService);

        RoleEntity role = role("STAFF", RoleType.ADMIN, false);
        UserEntity actor = UserEntity.builder().role(role("SUPER_ADMIN", RoleType.ADMIN, true)).build();
        actor.setId(UUID.randomUUID());
        when(roleRepository.findById(role.getId())).thenReturn(Optional.of(role));
        when(userRepository.countByRole_NameIgnoreCase("STAFF")).thenReturn(0L);
        doNothing().when(policyService).validateRoleDeletion(role, 0L);
        when(policyService.getCurrentActor()).thenReturn(actor);

        service.deleteRole(role.getId());

        verify(roleRepository).delete(role);
    }

    private static RoleEntity role(String name, RoleType roleType, boolean protectedRole) {
        RoleEntity role = RoleEntity.builder()
                .name(name)
                .roleType(roleType)
                .protectedRole(protectedRole)
                .permissions(new java.util.HashSet<>())
                .build();
        role.setId(UUID.randomUUID());
        return role;
    }
}
