package com.nchuy099.SmartPharma.recommendation.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RcmRecommendationResponse(
        @JsonProperty("product_id") String productId,
        @JsonProperty("score") double score,
        @JsonProperty("source") String source,
        @JsonProperty("product") RcmProductResponse product) {

    public record RcmProductResponse(
            @JsonProperty("id") String id,
            @JsonProperty("slug") String slug,
            @JsonProperty("name") String name,
            @JsonProperty("web_name") String webName,
            @JsonProperty("primary_image") String primaryImage,
            @JsonProperty("average_rating") double averageRating,
            @JsonProperty("total_reviews") int totalReviews,
            @JsonProperty("variants") List<RcmProductVariantResponse> variants) {
    }

    public record RcmProductVariantResponse(
            @JsonProperty("id") String id,
            @JsonProperty("sale_price") double salePrice,
            @JsonProperty("is_default") boolean isDefault,
            @JsonProperty("is_active") boolean isActive,
            @JsonProperty("available_quantity") Integer availableQuantity) {
    }
}
