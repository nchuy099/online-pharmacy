import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type { Product } from "@/features/product/types/domain";
import type { RecommendationItem, RecommendationRequest } from "../types/domain";

interface RecommendationApiResponse {
    product_id: string;
    score: number;
    source: string;
    product?: {
        id: string;
        slug: string;
        name: string;
        web_name?: string | null;
        primary_image?: string | null;
        average_rating?: number;
        total_reviews?: number;
        variants?: Array<{
            id: string;
            sale_price: number;
            is_default: boolean;
            is_active: boolean;
            available_quantity?: number | null;
        }>;
    } | null;
}

const inFlightGetRequests = new Map<string, Promise<RecommendationApiResponse[]>>();

const buildKey = (path: string, params: Record<string, unknown>) =>
    `${path}?${JSON.stringify(params)}`;

const dedupGet = (
    path: string,
    params: Record<string, unknown>
): Promise<RecommendationApiResponse[]> => {
    const key = buildKey(path, params);
    const existing = inFlightGetRequests.get(key);
    if (existing) {
        return existing;
    }

    const request = axios
        .get<ApiResponse<RecommendationApiResponse[]>>(path, {
            params,
            timeout: 30000,
        })
        .then((res) => {
            if (!res.data.success) {
                throw new Error(res.data.error || "Không tải được danh sách đề xuất");
            }
            return res.data.data || [];
        })
        .finally(() => {
            inFlightGetRequests.delete(key);
        });

    inFlightGetRequests.set(key, request);
    return request;
};

const mapRecommendationProductToDomain = (raw: NonNullable<RecommendationApiResponse["product"]>): Product => ({
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    webName: raw.web_name ?? null,
    primaryImage: raw.primary_image ?? null,
    averageRating: Number(raw.average_rating ?? 0),
    totalReviews: Number(raw.total_reviews ?? 0),
    variants: (raw.variants ?? []).map((variant) => ({
        id: variant.id,
        sku: "",
        unitType: "Sản phẩm",
        specification: null,
        salePrice: Number(variant.sale_price ?? 0),
        discountPercent: null,
        availableQuantity: variant.available_quantity ?? null,
        isDefault: Boolean(variant.is_default),
        isActive: Boolean(variant.is_active),
    })),
    code: null,
    brand: null,
    brandOrigin: null,
    producer: null,
    description: null,
    careful: null,
    adverseEffect: null,
    preservation: null,
    usage: null,
    dosage: null,
    secondaryImages: [],
    images: [],
    ingredients: [],
    categories: [],
    defaultVariantId: null,
});

export const recommendationApi = {
    getRecommendations: async (request: RecommendationRequest): Promise<RecommendationItem[]> => {
        const data = await dedupGet("/recommendations", {
            current_item_id: request.currentItemId,
            top_k: request.topK ?? 8,
        });

        return data
            .filter((item) => item.product != null)
            .map((item) => ({
                productId: String(item.product_id),
                score: Number(item.score || 0),
                source: item.source || "unknown",
                product: mapRecommendationProductToDomain(item.product!),
            }));
    },
    getTrendingRecommendations: async (topK = 8): Promise<RecommendationItem[]> => {
        const data = await dedupGet("/recommendations/trending", {
            top_k: topK,
        });

        return data
            .filter((item) => item.product != null)
            .map((item) => ({
                productId: String(item.product_id),
                score: Number(item.score || 0),
                source: item.source || "unknown",
                product: mapRecommendationProductToDomain(item.product!),
            }));
    },
};
