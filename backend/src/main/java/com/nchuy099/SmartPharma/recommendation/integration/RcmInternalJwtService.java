package com.nchuy099.SmartPharma.recommendation.integration;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;

@Service
public class RcmInternalJwtService {

    @Value("${rcm-service.internal-jwt-secret}")
    private String secret;

    @Value("${rcm-service.internal-jwt-issuer}")
    private String issuer;

    @Value("${rcm-service.internal-jwt-audience}")
    private String audience;

    @Value("${rcm-service.internal-jwt-expire-seconds}")
    private long expireSeconds;

    public String createToken() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("RCM_INTERNAL_JWT_SECRET is not configured");
        }

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(expireSeconds);

        try {
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject("smart-pharma-backend")
                    .issueTime(Date.from(issuedAt))
                    .expirationTime(Date.from(expiresAt))
                    .issuer(issuer)
                    .audience(List.of(audience))
                    .build();

            JWSObject jwsObject = new JWSObject(
                    new JWSHeader(JWSAlgorithm.HS256),
                    new Payload(claimsSet.toJSONObject()));
            jwsObject.sign(new MACSigner(secret.getBytes(StandardCharsets.UTF_8)));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Failed to create internal RCM JWT", e);
        }
    }
}
