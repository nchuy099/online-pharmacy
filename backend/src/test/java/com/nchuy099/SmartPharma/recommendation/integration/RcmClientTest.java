package com.nchuy099.SmartPharma.recommendation.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.nchuy099.SmartPharma.recommendation.dto.RcmRecommendationResponse;

class RcmClientTest {

    private RestTemplate restTemplate;
    private RcmInternalJwtService internalJwtService;
    private RcmClient client;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        internalJwtService = mock(RcmInternalJwtService.class);
        client = new RcmClient(restTemplate, internalJwtService);
        ReflectionTestUtils.setField(client, "baseUrl", "http://rcm-service");
    }

    @Test
    void requestRecommendationsShouldForwardJwtAndQueryParams() {
        when(internalJwtService.createToken()).thenReturn("token");
        when(restTemplate.exchange(
                any(URI.class),
                any(HttpMethod.class),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<org.springframework.core.ParameterizedTypeReference<List<RcmRecommendationResponse>>>any()))
                .thenReturn(ResponseEntity.ok(List.of()));

        List<RcmRecommendationResponse> body = client.requestRecommendations("user-1", "item-9", 12);

        assertEquals(List.of(), body);
        ArgumentCaptor<URI> uriCaptor = ArgumentCaptor.forClass(URI.class);
        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(
                uriCaptor.capture(),
                org.mockito.ArgumentMatchers.eq(HttpMethod.GET),
                entityCaptor.capture(),
                org.mockito.ArgumentMatchers.<org.springframework.core.ParameterizedTypeReference<List<RcmRecommendationResponse>>>any());
        assertTrue(uriCaptor.getValue().toString().contains("user_id=user-1"));
        assertTrue(uriCaptor.getValue().toString().contains("current_item_id=item-9"));
        assertTrue(uriCaptor.getValue().toString().contains("top_k=12"));
        assertEquals("Bearer token", entityCaptor.getValue().getHeaders().getFirst("Authorization"));
        verify(internalJwtService).createToken();
    }

    @Test
    void requestTrendingShouldForwardJwt() {
        when(internalJwtService.createToken()).thenReturn("token");
        when(restTemplate.exchange(
                any(URI.class),
                any(HttpMethod.class),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<org.springframework.core.ParameterizedTypeReference<List<RcmRecommendationResponse>>>any()))
                .thenReturn(ResponseEntity.ok(List.of()));

        List<RcmRecommendationResponse> body = client.requestTrending(8);

        assertEquals(List.of(), body);
        verify(internalJwtService).createToken();
        verify(restTemplate).exchange(
                any(URI.class),
                org.mockito.ArgumentMatchers.eq(HttpMethod.GET),
                any(HttpEntity.class),
                org.mockito.ArgumentMatchers.<org.springframework.core.ParameterizedTypeReference<List<RcmRecommendationResponse>>>any());
    }
}
