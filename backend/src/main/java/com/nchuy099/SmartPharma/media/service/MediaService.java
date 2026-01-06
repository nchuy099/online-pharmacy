package com.nchuy099.SmartPharma.media.service;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.nchuy099.SmartPharma.media.domain.enums.UploadType;
import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.user.repository.UserRepository;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
@Slf4j
@RequiredArgsConstructor
public class MediaService {

    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;
    private final S3Presigner s3Presigner;

    @Value("${media-container-expiration-minutes}")
    private int mediaContainerExpirationMins;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    public String createPreSignedUploadUrl(
            String userId,
            String containerId,
            String mediaFileId,
            String contentType,
            UploadType uploadType) {
        return createPreSignedUpload(userId, containerId, mediaFileId, contentType, uploadType).getUploadUrl();
    }

    public PresignedUpload createPreSignedUpload(
            String userId,
            String containerId,
            String mediaFileId,
            String contentType,
            UploadType uploadType) {

        String normalizedContentType = normalizeImageContentType(contentType);
        String key = generateS3ObjectKey(userId, containerId, mediaFileId, normalizedContentType, uploadType);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.of(mediaContainerExpirationMins, ChronoUnit.MINUTES))
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

        return PresignedUpload.builder()
                .uploadUrl(presignedRequest.url().toString())
                .fileUrl(buildFileUrl(key))
                .key(key)
                .build();
    }

    public String validateAndNormalizeImageUrl(String imageUrl, UploadType uploadType) {
        if (!StringUtils.hasText(imageUrl)) {
            throw new AppException(ErrorCode.BAD_REQUEST, humanReadableType(uploadType) + " URL is invalid");
        }

        URI uri;
        try {
            uri = new URI(imageUrl.trim());
        } catch (URISyntaxException exception) {
            throw new AppException(ErrorCode.BAD_REQUEST, humanReadableType(uploadType) + " URL is invalid");
        }

        if (!"https".equalsIgnoreCase(uri.getScheme()) || !StringUtils.hasText(uri.getHost())) {
            throw new AppException(ErrorCode.BAD_REQUEST, humanReadableType(uploadType) + " URL is invalid");
        }

        String key;
        try {
            key = extractKeyFromUrl(uri);
        } catch (AppException exception) {
            throw new AppException(ErrorCode.BAD_REQUEST, humanReadableType(uploadType) + " URL is invalid");
        }

        if (!StringUtils.hasText(key)) {
            throw new AppException(ErrorCode.BAD_REQUEST, humanReadableType(uploadType) + " URL is invalid");
        }

        return buildFileUrl(key);
    }

    public String inferContentTypeFromUrl(String imageUrl) {
        String normalizedUrl = imageUrl == null ? "" : imageUrl.toLowerCase(Locale.ROOT);
        if (normalizedUrl.endsWith(".png")) {
            return "image/png";
        }
        if (normalizedUrl.endsWith(".webp")) {
            return "image/webp";
        }
        if (normalizedUrl.endsWith(".gif")) {
            return "image/gif";
        }
        if (normalizedUrl.endsWith(".jpg") || normalizedUrl.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        return "image/*";
    }

    public Set<String> validateAndNormalizeImageUrls(Set<String> imageUrls, UploadType uploadType) {
        Set<String> normalized = new LinkedHashSet<>();
        for (String imageUrl : imageUrls) {
            String normalizedUrl = validateAndNormalizeImageUrl(imageUrl, uploadType);
            if (!normalized.add(normalizedUrl)) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Duplicate " + humanReadableType(uploadType).toLowerCase(Locale.ROOT) + " URLs are not allowed");
            }
        }
        return normalized;
    }

    private String normalizeImageContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return "image/jpeg";
        }

        String normalized = contentType.trim().toLowerCase(Locale.ROOT);
        if (!normalized.startsWith("image/")) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Only image uploads are supported");
        }

        return normalized;
    }

    private String resolveImageExtension(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return "jpg";
        }

        String normalized = contentType.trim().toLowerCase(Locale.ROOT);
        if (!normalized.startsWith("image/")) {
            return "jpg";
        }

        String extension = normalized.substring(normalized.indexOf('/') + 1).trim();
        if (!StringUtils.hasText(extension)) {
            return "jpg";
        }

        return extension;
    }

    private String generateS3ObjectKey(
            String userId,
            String containerId,
            String mediaFileId,
            String contentType,
            UploadType uploadType) {

        String extension = resolveImageExtension(contentType);
        String generatedId = UUID.randomUUID().toString();

        return switch (uploadType) {
            case AVATAR, PRODUCT_IMAGE -> String.format("%s.%s", generatedId, extension);
            case POST -> String.format("%s.%s", StringUtils.hasText(mediaFileId) ? mediaFileId : generatedId, extension);
        };
    }

    private String buildFileUrl(String key) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, key);
    }

    private String extractKeyFromUrl(URI uri) {
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        String bucketHostWithRegion = (bucket + ".s3." + region + ".amazonaws.com").toLowerCase(Locale.ROOT);
        String bucketHostWithoutRegion = (bucket + ".s3.amazonaws.com").toLowerCase(Locale.ROOT);
        String path = uri.getPath() == null ? "" : uri.getPath();

        if (host.equals(bucketHostWithRegion) || host.equals(bucketHostWithoutRegion)) {
            return path.startsWith("/") ? path.substring(1) : path;
        }

        String pathStyleHostWithRegion = ("s3." + region + ".amazonaws.com").toLowerCase(Locale.ROOT);
        String pathStyleHostWithoutRegion = "s3.amazonaws.com";
        if (host.equals(pathStyleHostWithRegion) || host.equals(pathStyleHostWithoutRegion)) {
            String bucketPrefix = "/" + bucket + "/";
            if (path.startsWith(bucketPrefix)) {
                return path.substring(bucketPrefix.length());
            }
        }

        throw new AppException(ErrorCode.BAD_REQUEST, "Image URL is invalid");
    }

    private String defaultSegment(String value) {
        return StringUtils.hasText(value) ? value : "anonymous";
    }

    private String expectedPrefix(UploadType uploadType) {
        return switch (uploadType) {
            case AVATAR -> "images/avatars";
            case PRODUCT_IMAGE -> "images/products";
            case POST -> "images/posts";
        };
    }

    private String humanReadableType(UploadType uploadType) {
        return switch (uploadType) {
            case AVATAR -> "Avatar";
            case PRODUCT_IMAGE -> "Product image";
            case POST -> "Post image";
        };
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class PresignedUpload {
        private final String uploadUrl;
        private final String fileUrl;
        private final String key;
        private final String contentType;
    }
}
