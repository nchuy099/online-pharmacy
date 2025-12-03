package com.nchuy099.SmartPharma.common.security;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import com.nchuy099.SmartPharma.token.domain.enums.TokenType;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.token.service.JwtTokenService;
import com.nchuy099.SmartPharma.token.entity.BlackListToken;
import com.nchuy099.SmartPharma.token.repository.BlackListTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class CustomJwtDecoder implements JwtDecoder {

    @Value("${jwt.access.key}")
    private String accessKey;

    NimbusJwtDecoder nimbusJwtDecoder = null;

    private final JwtTokenService jwtService;
    private final BlackListTokenRepository blackListTokenRepository;

    @Override
    public Jwt decode(String token) {
        Jwt jwt = jwtService.decodeToken(TokenType.ACCESS, token);
        UUID jti = UUID.fromString(jwt.getClaimAsString("jti"));
        Optional<BlackListToken> blackListOpt = blackListTokenRepository.findByJti(jti);
        if (blackListOpt.isPresent()) {
            log.info("Token is blacklisted: {}", jti);
            throw new AppException(ErrorCode.UNAUTHORIZED, "Token is blacklisted");
        }
        return jwt;
    }
}
