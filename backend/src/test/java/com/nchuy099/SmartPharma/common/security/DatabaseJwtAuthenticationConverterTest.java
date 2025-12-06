package com.nchuy099.SmartPharma.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.user.entity.PermissionEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.enums.UserStatus;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class DatabaseJwtAuthenticationConverterTest {

    @Test
    void convertShouldMapAuthoritiesFromDatabaseRole() {
        UUID userId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();

        RoleEntity role = RoleEntity.builder()
                .name("STAFF")
                .permissions(Set.of(
                        PermissionEntity.builder().name("READ_USER").build(),
                        PermissionEntity.builder().name("UPDATE_USER").build()))
                .build();
        role.setId(roleId);

        UserEntity user = UserEntity.builder()
                .status(UserStatus.ACTIVE)
                .role(role)
                .build();
        user.setId(userId);

        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByIdWithRolePermissions(userId)).thenReturn(java.util.Optional.of(user));

        DatabaseJwtAuthenticationConverter converter = new DatabaseJwtAuthenticationConverter(userRepository);
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(userId.toString())
                .claim("roleId", roleId.toString())
                .build();

        List<String> authorities = converter.convert(jwt)
                .getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        assertThat(authorities).contains("ROLE_STAFF", "READ_USER", "UPDATE_USER");
    }

    @Test
    void convertShouldRejectWhenRoleMismatch() {
        UUID userId = UUID.randomUUID();

        RoleEntity role = RoleEntity.builder()
                .name("STAFF")
                .build();
        role.setId(UUID.randomUUID());

        UserEntity user = UserEntity.builder()
                .status(UserStatus.ACTIVE)
                .role(role)
                .build();
        user.setId(userId);

        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByIdWithRolePermissions(userId)).thenReturn(java.util.Optional.of(user));

        DatabaseJwtAuthenticationConverter converter = new DatabaseJwtAuthenticationConverter(userRepository);
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(userId.toString())
                .claim("roleId", UUID.randomUUID().toString())
                .build();

        assertThrows(AppException.class, () -> converter.convert(jwt));
    }

    @Test
    void convertShouldRejectWhenUserIsInactive() {
        UUID userId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();

        RoleEntity role = RoleEntity.builder()
                .name("STAFF")
                .build();
        role.setId(roleId);

        UserEntity user = UserEntity.builder()
                .status(UserStatus.DELETED)
                .role(role)
                .build();
        user.setId(userId);

        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByIdWithRolePermissions(userId)).thenReturn(java.util.Optional.of(user));

        DatabaseJwtAuthenticationConverter converter = new DatabaseJwtAuthenticationConverter(userRepository);
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(userId.toString())
                .claim("roleId", roleId.toString())
                .build();

        AppException ex = assertThrows(AppException.class, () -> converter.convert(jwt));
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.USER_LOCKED);
    }
}
