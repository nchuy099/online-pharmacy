package com.nchuy099.SmartPharma.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.token.domain.enums.TokenType;
import com.nchuy099.SmartPharma.token.dto.TokenResult;
import com.nchuy099.SmartPharma.token.entity.RefreshToken;
import com.nchuy099.SmartPharma.token.repository.RefreshTokenRepository;
import com.nchuy099.SmartPharma.token.service.JwtTokenService;
import com.nchuy099.SmartPharma.user.entity.RoleEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.enums.RoleType;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

class OAuth2AuthenticationSuccessHandlerTest {

    @Test
    void onAuthenticationSuccessShouldPersistRefreshTokenAndRedirectWithTokens() throws Exception {
        JwtTokenService jwtTokenService = mock(JwtTokenService.class);
        UserRepository userRepository = mock(UserRepository.class);
        RefreshTokenRepository refreshTokenRepository = mock(RefreshTokenRepository.class);

        OAuth2AuthenticationSuccessHandler handler =
                new OAuth2AuthenticationSuccessHandler(jwtTokenService, userRepository, refreshTokenRepository);
        ReflectionTestUtils.setField(handler, "redirectUri", "http://localhost:5173/oauth2/callback");

        UUID userId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();
        RoleEntity role = RoleEntity.builder()
                .name("CUSTOMER")
                .roleType(RoleType.CUSTOMER)
                .build();
        role.setId(roleId);

        UserEntity user = UserEntity.builder()
                .email("customer@example.com")
                .role(role)
                .build();
        user.setId(userId);

        when(userRepository.findByEmailWithRolePermissions("customer@example.com")).thenReturn(Optional.of(user));
        when(jwtTokenService.generate(eq(TokenType.ACCESS), any(Instant.class), any(UserEntity.class), any(UUID.class)))
                .thenReturn(TokenResult.builder()
                        .type(TokenType.ACCESS)
                        .token("access-token")
                        .expiresAt(Instant.parse("2026-06-10T00:00:00Z"))
                        .build());
        when(jwtTokenService.generate(eq(TokenType.REFRESH), any(Instant.class), any(UserEntity.class), any(UUID.class)))
                .thenReturn(TokenResult.builder()
                        .type(TokenType.REFRESH)
                        .token("refresh-token")
                        .expiresAt(Instant.parse("2026-06-17T00:00:00Z"))
                        .build());

        OAuth2User principal = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                Map.of("email", "customer@example.com"),
                "email");
        var authentication = new UsernamePasswordAuthenticationToken(principal, "ignored", principal.getAuthorities());

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<RefreshToken> refreshTokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(refreshTokenCaptor.capture());
        assertThat(refreshTokenCaptor.getValue().getUser()).isSameAs(user);
        assertThat(refreshTokenCaptor.getValue().getExpiresAt())
                .isEqualTo(Instant.parse("2026-06-17T00:00:00Z"));
        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:5173/oauth2/callback?accessToken=access-token&refreshToken=refresh-token");
    }
}
