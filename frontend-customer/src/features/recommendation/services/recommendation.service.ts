import { recommendationApi } from "../api/recommendation.api";
import type { RecommendationRequest, RecommendedProduct } from "../types/domain";

export const recommendationService = {
    getRecommendedProducts: async (request: RecommendationRequest): Promise<RecommendedProduct[]> => {
        const items = await recommendationApi.getRecommendations(request);
        return items
            .map((item) => {
                return {
                    product: item.product,
                    score: item.score,
                    source: item.source,
                };
            })
            .filter((entry): entry is RecommendedProduct => Boolean(entry.product));
    },
    getTrendingProducts: async (topK = 8): Promise<RecommendedProduct[]> => {
        const items = await recommendationApi.getTrendingRecommendations(topK);
        return items
            .map((item) => {
                return {
                    product: item.product,
                    score: item.score,
                    source: item.source,
                };
            })
            .filter((entry): entry is RecommendedProduct => Boolean(entry.product));
    },
};
