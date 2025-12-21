package com.nchuy099.SmartPharma.chat.integration;

import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

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
public class ChatbotInternalJwtService {

    @Value("${chatbot-ai.internal-jwt-secret}")
    private String secret;

    @Value("${chatbot-ai.internal-jwt-issuer}")
    private String issuer;

    @Value("${chatbot-ai.internal-jwt-audience}")
    private String audience;

    @Value("${chatbot-ai.internal-jwt-expire-seconds}")
    private long expireSeconds;

    public String createToken(UUID userId, String conversationId) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("CHATBOT_INTERNAL_JWT_SECRET is not configured");
        }

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(expireSeconds);

        try {
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(userId.toString())
                    .issueTime(Date.from(issuedAt))
                    .expirationTime(Date.from(expiresAt))
                    .issuer(issuer)
                    .audience(List.of(audience))
                    .claim("conversation_id", conversationId)
                    .build();

            JWSObject jwsObject = new JWSObject(
                    new JWSHeader(JWSAlgorithm.HS256),
                    new Payload(claimsSet.toJSONObject()));
            jwsObject.sign(new MACSigner(secret.getBytes(StandardCharsets.UTF_8)));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Failed to create internal chatbot JWT", e);
        }
    }
}
