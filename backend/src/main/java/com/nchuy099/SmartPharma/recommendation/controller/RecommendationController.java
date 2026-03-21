package com.nchuy099.SmartPharma.recommendation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.nchuy099.SmartPharma.recommendation.dto.RcmRecommendationResponse;
import com.nchuy099.SmartPharma.recommendation.service.RecommendationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/recommendations")
    public List<RcmRecommendationResponse> getRecommendations(
            @RequestParam(name = "current_item_id", required = false) String currentItemId,
            @RequestParam(name = "top_k", defaultValue = "8") int topK) {
        log.info("Get recommendations request received currentItemId={} topK={}", currentItemId, topK);
        return recommendationService.getRecommendations(currentItemId, topK);
    }

    @GetMapping("/recommendations/trending")
    public List<RcmRecommendationResponse> getTrending(@RequestParam(name = "top_k", defaultValue = "8") int topK) {
        log.info("Get trending recommendations request received topK={}", topK);
        return recommendationService.getTrending(topK);
    }
}
