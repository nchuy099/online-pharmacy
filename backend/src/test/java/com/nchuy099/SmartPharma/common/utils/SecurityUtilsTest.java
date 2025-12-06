package com.nchuy099.SmartPharma.common.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import com.nchuy099.SmartPharma.user.repository.UserRepository;

import static org.mockito.Mockito.mock;

class SecurityUtilsTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final SecurityUtils securityUtils = new SecurityUtils(userRepository);

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserId_withJwtAuthenticationToken_returnsJwtSubject() {
        UUID userId = UUID.randomUUID();
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(userId.toString())
                .claim("roleId", UUID.randomUUID().toString())
                .build();
        JwtAuthenticationToken authentication = new JwtAuthenticationToken(
                jwt,
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UUID actual = securityUtils.getCurrentUserId();

        assertThat(actual).isEqualTo(userId);
    }

    @Test
    void getCurrentUserId_withNonJwtAuthentication_usesAuthenticationNameAsUserId() {
        UUID userId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userId.toString(),
                "N/A",
                List.of(new SimpleGrantedAuthority("ROLE_PHARMACIST")));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UUID actual = securityUtils.getCurrentUserId();

        assertThat(actual).isEqualTo(userId);
    }
}
