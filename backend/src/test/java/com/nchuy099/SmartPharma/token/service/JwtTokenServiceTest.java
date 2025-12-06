package com.nchuy099.SmartPharma.token.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.token.domain.enums.TokenType;
import com.nchuy099.SmartPharma.token.dto.TokenResult;
import com.nchuy099.SmartPharma.user.entity.PermissionEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;

class JwtTokenServiceTest {

    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        jwtTokenService = new JwtTokenService();

        ReflectionTestUtils.setField(jwtTokenService, "accessKey", "12345678901234567890123456789012");
        ReflectionTestUtils.setField(jwtTokenService, "refreshKey", "abcdefghijklmnopqrstuvwxyz123456");
        ReflectionTestUtils.setField(jwtTokenService, "resetKey", "ZYXWVUTSRQPONMLKJIHGFEDCBA123456");

        ReflectionTestUtils.setField(jwtTokenService, "accessExpireMins", 15L);
        ReflectionTestUtils.setField(jwtTokenService, "refreshExpireDays", 7L);
        ReflectionTestUtils.setField(jwtTokenService, "resetExpireMins", 10L);
    }

    @Test
    void generateShouldReturnTokenResultWithExpectedTypeAndExpiry() {
        Instant issuedAt = Instant.now();
        UserEntity user = userWithStaffRole(Set.of("READ_USER", "UPDATE_USER"));

        TokenResult result = jwtTokenService.generate(TokenType.ACCESS, issuedAt, user, UUID.randomUUID());

        assertEquals(TokenType.ACCESS, result.getType());
        assertEquals(issuedAt.plusSeconds(15 * 60), result.getExpiresAt());

        String roleId = jwtTokenService.decodeToken(TokenType.ACCESS, result.getToken()).getClaimAsString("roleId");
        assertThat(roleId).isEqualTo(user.getRole().getId().toString());
    }

    @Test
    void decodeTokenShouldThrowWhenTokenTypeMismatch() {
        UserEntity user = userWithStaffRole(Set.of("READ_USER"));

        String accessToken = jwtTokenService.generate(TokenType.ACCESS, Instant.now(), user, UUID.randomUUID()).getToken();

        assertThrows(AppException.class, () -> jwtTokenService.decodeToken(TokenType.REFRESH, accessToken));
    }

    private UserEntity userWithStaffRole(Set<String> permissions) {
        RoleEntity role = RoleEntity.builder()
                .name("STAFF")
                .permissions(permissions.stream()
                        .map(permission -> PermissionEntity.builder().name(permission).build())
                        .collect(java.util.stream.Collectors.toSet()))
                .build();
        role.setId(UUID.randomUUID());

        UserEntity user = UserEntity.builder()
                .role(role)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }
}
