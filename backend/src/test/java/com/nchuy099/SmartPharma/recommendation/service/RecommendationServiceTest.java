package com.nchuy099.SmartPharma.recommendation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.recommendation.dto.RcmRecommendationResponse;
import com.nchuy099.SmartPharma.recommendation.integration.RcmClient;

class RecommendationServiceTest {

    private RcmClient rcmClient;
    private SecurityUtils securityUtils;
    private RecommendationService recommendationService;

    @BeforeEach
    void setUp() {
        rcmClient = mock(RcmClient.class);
        securityUtils = mock(SecurityUtils.class);
        recommendationService = new RecommendationService(rcmClient, securityUtils);
    }

    @Test
    void getRecommendationsShouldUseAuthenticatedUserWhenPresent() {
        UUID userId = UUID.randomUUID();
        when(securityUtils.getCurrentUserIdIfPresent()).thenReturn(Optional.of(userId));
        when(rcmClient.requestRecommendations(userId.toString(), "item-1", 8)).thenReturn(List.of());

        List<RcmRecommendationResponse> body = recommendationService.getRecommendations("item-1", 8);

        assertEquals(List.of(), body);
        verify(rcmClient).requestRecommendations(userId.toString(), "item-1", 8);
    }

    @Test
    void getTrendingShouldDelegateToClient() {
        when(rcmClient.requestTrending(10)).thenReturn(List.of());

        List<RcmRecommendationResponse> body = recommendationService.getTrending(10);

        assertEquals(List.of(), body);
        verify(rcmClient).requestTrending(10);
    }
}
