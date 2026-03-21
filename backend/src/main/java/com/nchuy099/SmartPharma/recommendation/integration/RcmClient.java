package com.nchuy099.SmartPharma.recommendation.integration;

import java.net.URI;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.nchuy099.SmartPharma.common.exception.AppException;
import com.nchuy099.SmartPharma.common.exception.ErrorCode;
import com.nchuy099.SmartPharma.recommendation.dto.RcmRecommendationResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class RcmClient {

    private final RestTemplate restTemplate;
    private final RcmInternalJwtService internalJwtService;

    @Value("${rcm-service.base-url}")
    private String baseUrl;

    public List<RcmRecommendationResponse> requestRecommendations(String userId, String currentItemId, int topK) {
        URI uri = buildUri("/api/v1/recommendations", userId, currentItemId, topK);
        return forwardGet(uri);
    }

    public List<RcmRecommendationResponse> requestTrending(int topK) {
        URI uri = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/api/v1/recommendations/trending")
                .queryParam("top_k", topK)
                .build(true)
                .toUri();
        return forwardGet(uri);
    }

    private URI buildUri(String path, String userId, String currentItemId, int topK) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(baseUrl)
                .path(path)
                .queryParam("top_k", topK);

        if (userId != null && !userId.isBlank()) {
            builder.queryParam("user_id", userId);
        }
        if (currentItemId != null && !currentItemId.isBlank()) {
            builder.queryParam("current_item_id", currentItemId);
        }
        return builder.build(true).toUri();
    }

    private List<RcmRecommendationResponse> forwardGet(URI uri) {
        String token = internalJwtService.createToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            var response = restTemplate.exchange(
                    uri,
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<RcmRecommendationResponse>>() {
                    });
            List<RcmRecommendationResponse> body = response.getBody();
            if (body == null) {
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Empty recommendation service response");
            }
            return body;
        } catch (RestClientException ex) {
            log.error("Failed to call rcm service at {}: {}", uri, ex.getMessage());
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to call recommendation service");
        }
    }
}
