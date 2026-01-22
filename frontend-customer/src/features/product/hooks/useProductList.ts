import { useState, useEffect } from "react";
import type { Product } from "../types/domain";
import type { Pagination } from "@/features/shared/api/types/api";
import { productService } from "../services/product.service";

export const useProductList = (
    initialPage: number = 1,
    categorySlug?: string,
    sortBy?: string,
    minPrice?: number,
    maxPrice?: number,
    search?: string
) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(initialPage);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await productService.getProducts(page, categorySlug, sortBy, minPrice, maxPrice, search);
            setProducts(data.products);
            setPagination(data.pagination);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [page, categorySlug, sortBy, minPrice, maxPrice, search]);

    return { products, pagination, loading, error, page, setPage, refreshProducts: fetchProducts };
};