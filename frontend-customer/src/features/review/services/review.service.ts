import { reviewApi } from "../api/review.api";
import type { Review, ReviewPage } from "../types/domain";
import type { CreateReviewReqDTO, ReviewPageResponseDTO, ReviewResponseDTO, UpdateReviewReqDTO } from "../types/dto";

const mapReviewDTOToDomain = (dto: ReviewResponseDTO): Review => ({
    id: dto.id,
    rating: dto.rating,
    comment: dto.comment,
    userName: dto.userName,
    productId: dto.productId,
    productName: dto.productName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
});

const mapReviewPageDTOToDomain = (dto: ReviewPageResponseDTO): ReviewPage => ({
    reviews: dto.reviews.map(mapReviewDTOToDomain),
    pagination: dto.pagination,
    averageRating: dto.averageRating,
    totalReviews: dto.totalReviews,
});

export const reviewService = {
    getReviewsByProduct: async (productId: string, page: number = 0, size: number = 5): Promise<ReviewPage> => {
        const response = await reviewApi.getReviewsByProduct(productId, page, size);
        return mapReviewPageDTOToDomain(response.data);
    },

    createReview: async (data: CreateReviewReqDTO): Promise<Review> => {
        const response = await reviewApi.createReview(data);
        return mapReviewDTOToDomain(response.data);
    },

    updateReview: async (reviewId: string, data: UpdateReviewReqDTO): Promise<Review> => {
        const response = await reviewApi.updateReview(reviewId, data);
        return mapReviewDTOToDomain(response.data);
    },

    deleteReview: async (reviewId: string): Promise<void> => {
        await reviewApi.deleteReview(reviewId);
    }
};
