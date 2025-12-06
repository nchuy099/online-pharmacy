package com.nchuy099.SmartPharma.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.client.RestClient;

import com.nchuy099.SmartPharma.auth.dto.request.LoginReq;
import com.nchuy099.SmartPharma.auth.dto.response.LoginResp;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.token.domain.enums.TokenType;
import com.nchuy099.SmartPharma.token.dto.TokenResult;
import com.nchuy099.SmartPharma.token.entity.RefreshToken;
import com.nchuy099.SmartPharma.token.repository.BlackListTokenRepository;
import com.nchuy099.SmartPharma.token.repository.RefreshTokenRepository;
import com.nchuy099.SmartPharma.token.repository.ResetPasswordTokenRepository;
import com.nchuy099.SmartPharma.token.service.JwtTokenService;
import com.nchuy099.SmartPharma.user.entity.AvatarEntity;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.enums.UserStatus;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class AuthServiceTest {

    private UserRepository userRepository;
    private RefreshTokenRepository refreshTokenRepository;
    private JwtTokenService jwtTokenService;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        jwtTokenService = mock(JwtTokenService.class);
        passwordEncoder = mock(PasswordEncoder.class);

        authService = new AuthService(
                mock(RestClient.class),
                userRepository,
                refreshTokenRepository,
                mock(BlackListTokenRepository.class),
                mock(ResetPasswordTokenRepository.class),
                jwtTokenService,
                passwordEncoder);
    }

    @Test
    void loginShouldThrowWhenPasswordMismatch() {
        String email = "test@example.com";
        UserEntity user = UserEntity.builder()
                .email(email)
                .password("hashed")
                .status(UserStatus.ACTIVE)
                .role(role())
                .build();

        when(userRepository.findByEmailWithRolePermissions(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        LoginReq req = mock(LoginReq.class);
        when(req.getIdentifier()).thenReturn(email);
        when(req.getPassword()).thenReturn("wrong");

        AppException ex = assertThrows(AppException.class, () -> authService.login(req));
        assertEquals("Email or password is incorrect", ex.getMessage());
    }

    @Test
    void loginShouldRejectLockedAccountBeforePasswordCheck() {
        String email = "deleted@example.com";
        UserEntity user = UserEntity.builder()
                .email(email)
                .password("hashed")
                .status(UserStatus.DELETED)
                .role(role())
                .build();

        when(userRepository.findByEmailWithRolePermissions(email)).thenReturn(Optional.of(user));

        LoginReq req = mock(LoginReq.class);
        when(req.getIdentifier()).thenReturn(email);
        when(req.getPassword()).thenReturn("secret");

        AppException ex = assertThrows(AppException.class, () -> authService.login(req));
        assertEquals(ErrorCode.USER_LOCKED, ex.getErrorCode());
        assertEquals("Tài khoản đã bị khóa", ex.getMessage());
        verify(passwordEncoder, times(0)).matches(any(), any());
    }

    @Test
    void loginShouldPersistRefreshTokenAndReturnUserInfo() {
        String email = "ok@example.com";
        UserEntity user = UserEntity.builder()
                .email(email)
                .password("hashed")
                .status(UserStatus.ACTIVE)
                .fullName("Test User")
                .role(role())
                .avatars(List.of(AvatarEntity.builder().url("https://cdn/avatar.jpg").isActive(true).build()))
                .build();
        user.setId(UUID.randomUUID());

        when(userRepository.findByEmailWithRolePermissions(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);

        when(jwtTokenService.generate(eq(TokenType.ACCESS), any(Instant.class), eq(user), any(UUID.class)))
                .thenReturn(TokenResult.builder()
                        .type(TokenType.ACCESS)
                        .token("access-token")
                        .expiresAt(Instant.now().plusSeconds(300))
                        .build());

        when(jwtTokenService.generate(eq(TokenType.REFRESH), any(Instant.class), eq(user), any(UUID.class)))
                .thenReturn(TokenResult.builder()
                        .type(TokenType.REFRESH)
                        .token("refresh-token")
                        .expiresAt(Instant.now().plusSeconds(600))
                        .build());

        LoginReq req = mock(LoginReq.class);
        when(req.getIdentifier()).thenReturn(email);
        when(req.getPassword()).thenReturn("secret");

        LoginResp response = authService.login(req);

        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals("https://cdn/avatar.jpg", response.getUser().getAvatarUrl());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void refreshTokenShouldRotateWhenAccountIsActive() {
        UUID userId = UUID.randomUUID();
        UUID refreshJti = UUID.randomUUID();
        String refreshToken = "refresh-token";

        UserEntity user = UserEntity.builder()
                .email("active@example.com")
                .password("hashed")
                .status(UserStatus.ACTIVE)
                .role(role())
                .build();
        user.setId(userId);

        RefreshToken existingRefreshToken = RefreshToken.builder()
                .jti(refreshJti)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(600))
                .build();

        Jwt refreshJwt = Jwt.withTokenValue(refreshToken)
                .header("alg", "none")
                .subject(userId.toString())
                .claim("jti", refreshJti.toString())
                .build();

        when(jwtTokenService.decodeToken(TokenType.REFRESH, refreshToken)).thenReturn(refreshJwt);
        when(userRepository.findByIdWithRolePermissions(userId)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByJti(refreshJti)).thenReturn(Optional.of(existingRefreshToken));
        when(jwtTokenService.generate(eq(TokenType.ACCESS), any(Instant.class), eq(user), any(UUID.class)))
                .thenReturn(TokenResult.builder()
                        .type(TokenType.ACCESS)
                        .token("new-access-token")
                        .expiresAt(Instant.now().plusSeconds(300))
                        .build());
        when(jwtTokenService.generate(eq(TokenType.REFRESH), any(Instant.class), eq(user), any(UUID.class)))
                .thenReturn(TokenResult.builder()
                        .type(TokenType.REFRESH)
                        .token("new-refresh-token")
                        .expiresAt(Instant.now().plusSeconds(600))
                        .build());

        var response = authService.refreshToken(refreshToken);

        assertEquals("new-access-token", response.getAccessToken());
        assertEquals("new-refresh-token", response.getRefreshToken());
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    void refreshTokenShouldRejectDeletedAccountAndRevokeRefreshToken() {
        UUID userId = UUID.randomUUID();
        UUID refreshJti = UUID.randomUUID();
        String refreshToken = "refresh-token";

        UserEntity user = UserEntity.builder()
                .email("deleted@example.com")
                .password("hashed")
                .status(UserStatus.DELETED)
                .role(role())
                .build();
        user.setId(userId);

        RefreshToken existingRefreshToken = RefreshToken.builder()
                .jti(refreshJti)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(600))
                .build();

        Jwt refreshJwt = Jwt.withTokenValue(refreshToken)
                .header("alg", "none")
                .subject(userId.toString())
                .claim("jti", refreshJti.toString())
                .build();

        when(jwtTokenService.decodeToken(TokenType.REFRESH, refreshToken)).thenReturn(refreshJwt);
        when(userRepository.findByIdWithRolePermissions(userId)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByJti(refreshJti)).thenReturn(Optional.of(existingRefreshToken));

        AppException ex = assertThrows(AppException.class, () -> authService.refreshToken(refreshToken));

        assertEquals(ErrorCode.USER_LOCKED, ex.getErrorCode());
        assertEquals("Tài khoản đã bị khóa", ex.getMessage());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    private RoleEntity role() {
        RoleEntity role = RoleEntity.builder()
                .name("STAFF")
                .build();
        role.setId(UUID.randomUUID());
        return role;
    }
}
