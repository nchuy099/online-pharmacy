package com.nchuy099.SmartPharma.media.service;

import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nchuy099.SmartPharma.media.domain.enums.MediaStatus;
import com.nchuy099.SmartPharma.media.domain.enums.MediaType;
import com.nchuy099.SmartPharma.media.domain.enums.UploadType;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.media.dto.ImageProcessedBody;
import com.nchuy099.SmartPharma.user.entity.AvatarEntity;
import com.nchuy099.SmartPharma.user.entity.UserEntity;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class WebhookService {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    @Value("${webhook.secret}")
    private String webhookSecret;

    public void verifySignature(String signature, ImageProcessedBody body) {

        log.info("Verifying signature");
        try {
            String bodyString = objectMapper.writeValueAsString(body);

            String expectedSignature = hmacSha256(bodyString, webhookSecret);

            if (!signature.equals(expectedSignature)) {
                log.warn("Invalid signature");
                throw new AppException(ErrorCode.UNAUTHORIZED, "Invalid signature");
            }

            log.info("Verified! Valid signature");
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize body: " + e.getMessage());
            throw new RuntimeException("Failed to serialize body: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void processWebhook(ImageProcessedBody body) {
        log.info("Processing Image processed webhook request");
        try {
            UploadType type = UploadType.valueOf(body.getType());

            String ownerId = body.getOwnerId();
            String fileId = body.getFileId();
            String url = body.getImage().getUrl();
            String contentType = body.getImage().getContentType();

            UserEntity userEntity = userRepository.findById(UUID.fromString(ownerId))
                    .orElseThrow(() -> {
                        log.warn("User not found");
                        throw new AppException(ErrorCode.NOT_FOUND, "User not found");
                    });
            // deactivate ALL active avatars
            userEntity.getAvatars()
                    .stream()
                    .filter(AvatarEntity::isActive)
                    .forEach(a -> a.setActive(false));
            AvatarEntity newAva = AvatarEntity.builder()
                    .url(url)
                    .contentType(contentType)
                    .isActive(true)
                    .user(userEntity)
                    .build();
            userEntity.getAvatars().add(newAva);
            userRepository.save(userEntity);
        } catch (Exception e) {
            log.warn("Failed to process image: {}", e.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to process image: " + e.getMessage());
        }

    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");

            mac.init(secretKey);

            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(rawHmac);

        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate HMAC", e);
        }
    }

}
