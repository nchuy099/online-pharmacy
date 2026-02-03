import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/features/product/types/domain";
import { recommendationService } from "../services/recommendation.service";

interface UseTrendingProductsResult {
    products: Product[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useTrendingProducts = (topK = 8): UseTrendingProductsResult => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTrendingProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const recommended = await recommendationService.getTrendingProducts(topK);
            setProducts(recommended.map((entry) => entry.product));
        } catch (err) {
            setError((err as Error).message || "Không tải được sản phẩm nổi bật");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [topK]);

    useEffect(() => {
        fetchTrendingProducts();
    }, [fetchTrendingProducts]);

    return {
        products,
        loading,
        error,
        refresh: fetchTrendingProducts,
    };
};
