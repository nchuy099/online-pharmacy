import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBox } from "react-icons/fa";

import type { OrderItem } from "../types/domain";
import { ReviewModal } from "@/features/review/components/ReviewModal";
import { FaEdit } from "react-icons/fa";
import { useAuthContext } from "@/features/auth/context/AuthContext";

interface Props {
    items: OrderItem[];
    orderStatus?: string;
}

export const OrderItemsList: React.FC<Props> = ({ items, orderStatus }) => {
    const [reviewItemId, setReviewItemId] = useState<string | null>(null);
    const reviewItem = items.find((i) => i.id === reviewItemId);
    const { hasPermission } = useAuthContext();
    const canManageReviews = hasPermission("CUSTOMER_REVIEW_MANAGE");

    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FaBox className="text-emerald-600" />
                Sản phẩm trong đơn hàng
            </h2>
            <div className="divide-y divide-gray-50">
                {items.map((item) => (
                    <div key={item.id} className="py-6 flex gap-4 first:pt-0 last:pb-0">
                        <Link to={`/${item.productSlug || item.productId}`} className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-50 overflow-hidden hover:scale-[1.02] transition-transform">
                            {item.productImageUrl ? (
                                <img
                                    src={item.productImageUrl}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-emerald-600 font-bold text-xl uppercase tracking-tighter">
                                    {item.productName?.charAt(0) || "P"}
                                </div>
                            )}
                        </Link>
                        <div className="flex-1">
                            <Link to={`/${item.productSlug || item.productId}`}>
                                <h3 className="font-bold text-gray-900 mb-1 hover:text-emerald-600 transition-colors line-clamp-2">{item.productWebName || item.productName}</h3>
                            </Link>
                            {/* Variant snapshot info */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {item.variantName && (
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        {item.variantName}
                                    </span>
                                )}
                                {item.unit && (
                                    <span className="text-xs text-gray-400 font-medium">
                                        Đơn vị: {item.unit}
                                    </span>
                                )}
                                {item.sku && (
                                    <span className="text-[10px] text-gray-300 font-medium">
                                        SKU: {item.sku}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <p className="text-gray-500">
                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.unitPrice)} x {item.quantity}
                                </p>
                                <p className="font-bold text-gray-900">
                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.unitPrice * item.quantity)}
                                </p>
                            </div>
                            {orderStatus === "DELIVERED" && canManageReviews && (
                                <div className="mt-3 flex justify-end">
                                    <button
                                        onClick={() => setReviewItemId(item.id)}
                                        disabled={item.review && !item.review.canEdit}
                                        className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                                            item.review 
                                                ? item.review.canEdit 
                                                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100" 
                                                    : "text-gray-400 bg-gray-50 cursor-not-allowed"
                                                : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                        }`}
                                    >
                                        <FaEdit />
                                        {item.review 
                                            ? item.review.canEdit ? "Sửa đánh giá" : "Đã đánh giá" 
                                            : "Đánh giá"
                                        }
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {reviewItem && (
                <ReviewModal
                    isOpen={!!reviewItemId}
                    onClose={() => setReviewItemId(null)}
                    orderItemId={reviewItem.id}
                    productName={reviewItem.productWebName || reviewItem.productName}
                    productImageUrl={reviewItem.productImageUrl}
                    initialData={reviewItem.review ? {
                        id: reviewItem.review.id,
                        rating: reviewItem.review.rating,
                        comment: reviewItem.review.comment
                    } : undefined}
                />
            )}
        </div>
    );
};
