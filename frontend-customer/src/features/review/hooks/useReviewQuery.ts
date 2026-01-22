import { useQuery } from "@tanstack/react-query";
import { reviewService } from "../services/review.service";
import type { ReviewPage } from "../types/domain";

export const useReviewQuery = (productId: string | undefined, page: number = 0, size: number = 5) => {
    return useQuery<ReviewPage, Error>({
        queryKey: ["reviews", productId, page, size],
        queryFn: () => {
            if (!productId) throw new Error("Product ID is required");
            return reviewService.getReviewsByProduct(productId, page, size);
        },
        enabled: !!productId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
