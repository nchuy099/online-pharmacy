import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/features/product/types/domain";
import type { RecommendationRequest } from "../types/domain";
import { recommendationService } from "../services/recommendation.service";

interface UseRecommendedProductsResult {
    products: Product[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useRecommendedProducts = (
    request: RecommendationRequest,
    options?: { enabled?: boolean }
): UseRecommendedProductsResult => {
    const enabled = options?.enabled ?? true;
    const currentItemId = request.currentItemId;
    const topK = request.topK;

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRecommendations = useCallback(async () => {
        if (!enabled) {
            setProducts([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const recommended = await recommendationService.getRecommendedProducts({
                currentItemId,
                topK,
            });
            const productList = recommended
                .map((entry) => entry.product)
                .filter((product) => (currentItemId ? product.id !== currentItemId : true));
            setProducts(productList);
        } catch (err) {
            setError((err as Error).message || "Không tải được danh sách đề xuất");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [enabled, currentItemId, topK]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    return {
        products,
        loading,
        error,
        refresh: fetchRecommendations,
    };
};
