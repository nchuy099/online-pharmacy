import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type { ProductDTO, ProductListResponseDTO } from "../types/dto";

export const productApi = {
    getProductDetails: async (productId: string): Promise<ProductDTO> => {
        const res = await axios.get<ApiResponse<ProductDTO>>(`/products/${productId}/details`);
        if (!res.data.success) {
            throw new Error(res.data.error || "Fetch product details failed");
        }
        return res.data.data;
    },

    getProductDetailsBySlug: async (slug: string): Promise<ProductDTO> => {
        const res = await axios.get<ApiResponse<ProductDTO>>(`/products/slug/${slug}`);
        if (!res.data.success) {
            throw new Error(res.data.error || "Fetch product details by slug failed");
        }
        return res.data.data;
    },

    getProductBySku: async (sku: string): Promise<ProductDTO> => {
        const res = await axios.get<ApiResponse<ProductDTO>>(`/products/${sku}`);
        if (!res.data.success) {
            throw new Error(res.data.error || "Fetch product details by sku failed");
        }
        return res.data.data;
    },

    getProductList: async (
        page: number,
        categorySlug?: string,
        sortBy?: string,
        minPrice?: number,
        maxPrice?: number,
        search?: string,
        size?: number
    ): Promise<ProductListResponseDTO> => {
        const res = await axios.get<ApiResponse<ProductListResponseDTO>>(`/products/list`, {
            params: { page, categorySlug, sortBy, minPrice, maxPrice, search, size }
        });
        if (!res.data.success) {
            throw new Error(res.data.error || "Fetch product details failed");
        }
        return res.data.data;
    },
};
