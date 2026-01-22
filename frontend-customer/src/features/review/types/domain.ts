export interface Review {
    id: string;
    rating: number;
    comment?: string;
    userName?: string;
    productId: string;
    productName: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewPage {
    reviews: Review[];
    pagination: {
        page: number;
        size: number;
        totalPages: number;
        totalElements: number;
    };
    averageRating: number;
    totalReviews: number;
}
