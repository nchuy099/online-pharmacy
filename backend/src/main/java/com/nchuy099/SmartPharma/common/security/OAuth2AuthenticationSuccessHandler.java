package com.nchuy099.SmartPharma.common.security;

import com.nchuy099.SmartPharma.token.domain.enums.TokenType;
import com.nchuy099.SmartPharma.token.dto.TokenResult;
import com.nchuy099.SmartPharma.token.entity.RefreshToken;
import com.nchuy099.SmartPharma.token.service.JwtTokenService;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;
import com.nchuy099.SmartPharma.token.repository.RefreshTokenRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.oauth2.redirect-uri:http://localhost:5173/oauth2/callback}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        UserEntity user = userRepository.findByEmailWithRolePermissions(email)
                .orElseThrow(() -> new RuntimeException("User not found after OAuth2 authentication"));

        Instant now = Instant.now();
        UUID jti = UUID.randomUUID();
        
        TokenResult accessToken = jwtTokenService.generate(TokenType.ACCESS, now, user, jti);
        TokenResult refreshToken = jwtTokenService.generate(TokenType.REFRESH, now, user, jti);

        refreshTokenRepository.save(RefreshToken.builder()
                .jti(jti)
                .user(user)
                .expiresAt(refreshToken.getExpiresAt())
                .build());

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("accessToken", accessToken.getToken())
                .queryParam("refreshToken", refreshToken.getToken())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
