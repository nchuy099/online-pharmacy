import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useCreateReview } from "../hooks/useReviewMutation";
import { StarRating } from "./StarRating";
import toast from "react-hot-toast";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderItemId: string;
    productName: string;
    productImageUrl?: string;
    initialData?: {
        id: string;
        rating: number;
        comment: string;
    };
}

import { useUpdateReview } from "../hooks/useReviewMutation";
import { useEffect } from "react";

export const ReviewModal = ({ isOpen, onClose, orderItemId, productName, productImageUrl, initialData }: ReviewModalProps) => {
    const [rating, setRating] = useState(initialData?.rating ?? 5);
    const [comment, setComment] = useState(initialData?.comment ?? "");
    const createReviewMutation = useCreateReview();
    const updateReviewMutation = useUpdateReview();

    useEffect(() => {
        if (isOpen && initialData) {
            setRating(initialData.rating);
            setComment(initialData.comment);
        } else if (isOpen) {
            setRating(5);
            setComment("");
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData) {
                await updateReviewMutation.mutateAsync({
                    reviewId: initialData.id,
                    data: {
                        rating,
                        comment: comment.trim() || undefined,
                    },
                });
                toast.success("Đã cập nhật đánh giá!");
            } else {
                await createReviewMutation.mutateAsync({
                    orderItemId,
                    rating,
                    comment: comment.trim() || undefined,
                });
                toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
            }
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Có lỗi xảy ra");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xl font-bold text-gray-900">Đánh giá sản phẩm</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {productImageUrl ? (
                                <img src={productImageUrl} alt={productName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-gray-400">No img</span>
                            )}
                        </div>
                        <h4 className="font-medium text-gray-900 line-clamp-2 leading-snug">{productName}</h4>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <span className="text-sm font-semibold text-gray-700">Chất lượng sản phẩm</span>
                            <StarRating rating={rating} onRatingChange={setRating} size="xl" />
                            <span className="text-sm text-amber-600 font-medium">
                                {rating === 5 ? "Tuyệt vời" : rating === 4 ? "Rất tốt" : rating === 3 ? "Bình thường" : rating === 2 ? "Không hài lòng" : "Rất tệ"}
                            </span>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Chia sẻ nhận xét của bạn <span className="text-gray-400 font-normal">(tùy chọn)</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Sản phẩm này thế nào? Chia sẻ trải nghiệm của bạn nhé..."
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none resize-none min-h-[120px] transition-all text-sm"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                Hủy thiết lập
                            </button>
                            <button
                                type="submit"
                                disabled={createReviewMutation.isPending || updateReviewMutation.isPending}
                                className="px-8 py-3 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createReviewMutation.isPending || updateReviewMutation.isPending ? "Đang gửi..." : initialData ? "Cập nhật" : "Gửi đánh giá"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
