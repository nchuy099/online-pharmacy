import React from "react";
import { StarRating } from "@/features/review/components/StarRating";

interface Props {
    brand?: string | null;
    brandOrigin?: string | null;
    producer?: string | null;
    productName: string;
    averageRating?: number;
    totalReviews?: number;
}

export const ProductBriefInfo: React.FC<Props> = ({
    brand,
    brandOrigin,
    producer,
    productName,
    averageRating,
    totalReviews
}) => {
    return (
        <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-3">
                {brandOrigin && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                        {brandOrigin}
                    </span>
                )}
                {brand && (
                    <span className="text-xs font-bold text-gray-500">
                        Thương hiệu: <span className="text-emerald-600 font-extrabold">{brand}</span>
                    </span>
                )}
                {producer && (
                    <span className="text-xs font-bold text-gray-500">
                        Nhà sản xuất: <span className="text-emerald-600 font-extrabold">{producer}</span>
                    </span>
                )}
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight">
                {productName}
            </h1>

            <div className="flex items-center gap-4 mb-5">
                <button
                    onClick={() => document.getElementById("product-reviews")?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 hover:bg-white hover:border-emerald-200 transition-all cursor-pointer group"
                >
                    <span className="text-sm font-bold text-gray-900 group-hover:text-emerald-600">
                        {averageRating ? averageRating.toFixed(1) : "0.0"}
                    </span>
                    <StarRating rating={averageRating || 0} readonly size="sm" />
                    <span className="text-xs text-gray-400 font-medium ml-1">
                        ({totalReviews || 0} đánh giá)
                    </span>
                </button>
            </div>

        </div>
    );
};
