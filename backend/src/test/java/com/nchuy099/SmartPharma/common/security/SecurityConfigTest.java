package com.nchuy099.SmartPharma.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import org.junit.jupiter.api.Test;

class SecurityConfigTest {

    @Test
    void publicEndpoints_shouldIncludeApiPrefixedWebhookPaths() throws Exception {
        Field field = SecurityConfig.class.getDeclaredField("PUBLIC_ENDPOINTS");
        field.setAccessible(true);

        String[] publicEndpoints = (String[]) field.get(null);

        assertThat(publicEndpoints)
                .contains("/internal/webhook/image-processed", "/api/internal/webhook/image-processed",
                        "/internal/sepay/webhook", "/api/internal/sepay/webhook");
    }
}
