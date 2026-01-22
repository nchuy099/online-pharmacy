export interface CreateReviewReqDTO {
    orderItemId: string;
    rating: number;
    comment?: string;
}

export interface UpdateReviewReqDTO {
    rating?: number;
    comment?: string;
}

export interface ReviewResponseDTO {
    id: string;
    rating: number;
    comment?: string;
    userName?: string;
    productId: string;
    productName: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewPageResponseDTO {
    reviews: ReviewResponseDTO[];
    pagination: {
        page: number;
        size: number;
        totalPages: number;
        totalElements: number;
    };
    averageRating: number;
    totalReviews: number;
}
