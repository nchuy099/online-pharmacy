import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useReviewQuery } from "../hooks/useReviewQuery";
import { StarRating } from "./StarRating";
import { FaUserCircle, FaExclamationTriangle } from "react-icons/fa";

interface ReviewListProps {
    productId: string;
}

export const ReviewList = ({ productId }: ReviewListProps) => {
    const [page, setPage] = useState(0);
    const size = 5;

    const { data: reviewPage, isLoading, isError } = useReviewQuery(productId, page, size);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-red-50 text-red-500 p-6 rounded-2xl flex items-center justify-center gap-3">
                <FaExclamationTriangle />
                <span className="font-medium">Không thể tải đánh giá lúc này.</span>
            </div>
        );
    }

    if (!reviewPage || reviewPage.reviews.length === 0) {
        return (
            <div className="bg-gray-50 rounded-3xl p-12 text-center border border-gray-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 shadow-sm border border-gray-100">
                    <StarRating rating={0} readonly size="xl" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Chưa có đánh giá nào</h4>
                <p className="text-gray-500 text-sm">Hãy là người đầu tiên mua và đánh giá sản phẩm này.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">
                Đánh giá từ khách hàng ({reviewPage.totalReviews})
            </h3>

            <div className="space-y-6">
                {reviewPage.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <FaUserCircle className="text-2xl opacity-50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-900">{review.userName || "Khách hàng"}</span>
                                        <span className="text-xs text-gray-400">
                                            {format(new Date(review.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                        </span>
                                    </div>
                                    <StarRating rating={review.rating} readonly size="sm" />
                                </div>
                                <div className="text-gray-700 text-sm leading-relaxed bg-gray-50/50 p-4 rounded-2xl">
                                    {review.comment ? (
                                        review.comment
                                    ) : (
                                        <span className="italic text-gray-400">Khách hàng không để lại bình luận.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {reviewPage.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-100">
                    <button
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Trước
                    </button>
                    <div className="flex items-center gap-1">
                        {[...Array(reviewPage.pagination.totalPages)].map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setPage(idx)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${page === idx
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                    : "text-gray-500 hover:bg-gray-100"
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        disabled={page === reviewPage.pagination.totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
};
