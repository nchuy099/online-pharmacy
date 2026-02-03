import type { Product } from "@/features/product/types/domain";

export interface RecommendationItem {
    productId: string;
    score: number;
    source: string;
    product: Product;
}

export interface RecommendationRequest {
    currentItemId?: string;
    topK?: number;
}

export interface RecommendedProduct {
    product: Product;
    score: number;
    source: string;
}
