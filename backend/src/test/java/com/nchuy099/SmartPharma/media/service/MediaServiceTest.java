package com.nchuy099.SmartPharma.media.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.nchuy099.SmartPharma.media.domain.enums.UploadType;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

class MediaServiceTest {

    private MediaService mediaService;
    private S3Presigner s3Presigner;

    @BeforeEach
    void setUp() {
        s3Presigner = S3Presigner.builder()
                .region(Region.AP_SOUTHEAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("test-access", "test-secret")))
                .build();

        mediaService = new MediaService(mock(com.nchuy099.SmartPharma.common.utils.SecurityUtils.class),
                mock(com.nchuy099.SmartPharma.user.repository.UserRepository.class), s3Presigner);

        ReflectionTestUtils.setField(mediaService, "mediaContainerExpirationMins", 15);
        ReflectionTestUtils.setField(mediaService, "bucket", "smartpharma-bucket");
        ReflectionTestUtils.setField(mediaService, "region", "ap-southeast-1");
    }

    @Test
    void createProductUploadRequestShouldExposeFinalFileUrlWithoutPrefix() {
        var response = mediaService.createPreSignedUpload("admin-1", null, null, "image/png", UploadType.PRODUCT_IMAGE);

        assertTrue(response.getUploadUrl().contains("smartpharma-bucket"));
        assertTrue(response.getFileUrl().startsWith("https://smartpharma-bucket.s3.ap-southeast-1.amazonaws.com/"));
        assertTrue(response.getFileUrl().endsWith(".png"));
        assertTrue(!response.getFileUrl().contains("images/"));
    }

    @Test
    void createAvatarUploadRequestShouldExposeFinalFileUrlWithoutPrefix() {
        var response = mediaService.createPreSignedUpload("user-1", null, null, "image/jpeg", UploadType.AVATAR);

        assertTrue(response.getUploadUrl().contains("smartpharma-bucket"));
        assertTrue(response.getFileUrl().startsWith("https://smartpharma-bucket.s3.ap-southeast-1.amazonaws.com/"));
        assertTrue(response.getFileUrl().endsWith(".jpeg"));
        assertTrue(!response.getFileUrl().contains("images/"));
    }

    @Test
    void shouldRecognizeAllowedS3UrlsWithoutPrefix() {
        String productUrl = "https://smartpharma-bucket.s3.ap-southeast-1.amazonaws.com/test-product.png";
        String avatarUrl = "https://smartpharma-bucket.s3.ap-southeast-1.amazonaws.com/test-avatar.jpeg";

        assertEquals(productUrl, mediaService.validateAndNormalizeImageUrl(productUrl, UploadType.PRODUCT_IMAGE));
        assertEquals(avatarUrl, mediaService.validateAndNormalizeImageUrl(avatarUrl, UploadType.AVATAR));
    }
}
