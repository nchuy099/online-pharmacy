package com.nchuy099.SmartPharma.recommendation.service;

import java.util.UUID;
import java.util.List;

import org.springframework.stereotype.Service;

import com.nchuy099.SmartPharma.common.utils.SecurityUtils;
import com.nchuy099.SmartPharma.recommendation.dto.RcmRecommendationResponse;
import com.nchuy099.SmartPharma.recommendation.integration.RcmClient;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RcmClient rcmClient;
    private final SecurityUtils securityUtils;

    public List<RcmRecommendationResponse> getRecommendations(String currentItemId, int topK) {
        String currentUserId = securityUtils.getCurrentUserIdIfPresent()
                .map(UUID::toString)
                .orElse(null);
        return rcmClient.requestRecommendations(currentUserId, currentItemId, topK);
    }

    public List<RcmRecommendationResponse> getTrending(int topK) {
        return rcmClient.requestTrending(topK);
    }
}
