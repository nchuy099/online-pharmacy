import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type { CreateReviewReqDTO, ReviewPageResponseDTO, ReviewResponseDTO, UpdateReviewReqDTO } from "../types/dto";

export const reviewApi = {
    getReviewsByProduct: async (productId: string, page: number = 0, size: number = 5): Promise<ApiResponse<ReviewPageResponseDTO>> => {
        const response = await axios.get(`/reviews/products/${productId}/list`, {
            params: { page, size }
        });
        return response.data;
    },

    createReview: async (data: CreateReviewReqDTO): Promise<ApiResponse<ReviewResponseDTO>> => {
        const response = await axios.post("/reviews/create", data);
        return response.data;
    },

    updateReview: async (reviewId: string, data: UpdateReviewReqDTO): Promise<ApiResponse<ReviewResponseDTO>> => {
        const response = await axios.put(`/reviews/${reviewId}/update`, data);
        return response.data;
    },

    deleteReview: async (reviewId: string): Promise<ApiResponse<void>> => {
        const response = await axios.delete(`/reviews/${reviewId}/delete`);
        return response.data;
    }
};
