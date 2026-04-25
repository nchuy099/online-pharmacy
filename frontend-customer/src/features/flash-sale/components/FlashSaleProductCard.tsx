import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";
import type { FlashSaleItemDTO } from "../types";
import { formatVND } from "@/features/product/product.utils";
import { getFlashSaleProgress, getVariantLabel } from "../utils";

interface FlashSaleProductCardProps {
    item: FlashSaleItemDTO;
}

export const FlashSaleProductCard = ({ item }: FlashSaleProductCardProps) => {
    const { progress } = getFlashSaleProgress(item);
    const variantLabel = getVariantLabel(item);

    return (
        <Link
            to={`/${item.productSlug}`}
            className="group overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-500/5"
        >
            <div className="relative aspect-[0.92] overflow-hidden bg-gradient-to-br from-rose-50 to-orange-50">
                {item.productImage ? (
                    <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="rounded-full bg-white/90 px-5 py-4 text-center shadow-xl shadow-rose-500/10">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-600">Flash</p>
                            <p className="mt-1 text-sm font-bold text-slate-600 line-clamp-2 max-w-[140px]">{item.productName}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-3 p-3.5">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-600">Flash sale</p>
                    <h3 className="mt-1 text-[13px] font-black leading-tight text-slate-900 line-clamp-2">
                        {item.productName}
                    </h3>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        {variantLabel || item.variantUnitType}
                    </p>
                </div>

                <div className="flex items-baseline gap-2">
                    <span className="text-[17px] font-black text-rose-600">
                        {formatVND(item.flashPrice)} <span className="text-[9px] font-black">đ</span>
                    </span>
                    <span className="text-xs font-black text-slate-300 line-through">{formatVND(item.originalPrice)} đ</span>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span>Còn {item.remainingStock}/{item.saleStock}</span>
                        <span>{progress}% đã bán</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 text-[12px] font-black text-rose-600 transition-all group-hover:gap-3">
                    Xem chi tiết <FaArrowRight className="text-[12px]" />
                </div>
            </div>
        </Link>
    );
};
