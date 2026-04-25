import React from "react";
import { FaMinus, FaPlus, FaShoppingBasket } from "react-icons/fa";
import type { ProductVariant } from "../types/domain";
import { formatUnitType, formatVND, getLiveFlashSale, isVariantPurchasable } from "../product.utils";

interface Props {
    variants: ProductVariant[];
    selectedVariant: ProductVariant | null;
    onVariantSelect: (variant: ProductVariant) => void;
    quantity: number;
    onQuantityChange: (q: number) => void;
    onAddToCart: () => void;
    onBuyNow: () => void;
    isProcessing: boolean;
    liveFlashSaleRemainingStock?: number | null;
}

export const ProductPurchaseActions: React.FC<Props> = ({
    variants,
    selectedVariant,
    onVariantSelect,
    quantity,
    onQuantityChange,
    onAddToCart,
    onBuyNow,
    isProcessing,
    liveFlashSaleRemainingStock,
}) => {
    const activeVariants = variants.filter(v => v.isActive);
    const flashSale = getLiveFlashSale(selectedVariant);
    const maxQuantity = flashSale
        ? (liveFlashSaleRemainingStock ?? flashSale.remainingStock ?? 0)
        : (selectedVariant?.availableQuantity ?? 0);
    const isOutOfStock = !selectedVariant || (flashSale ? maxQuantity <= 0 : !isVariantPurchasable(selectedVariant));
    const canPurchase = selectedVariant && !isOutOfStock && !isProcessing;

    return (
        <div className="mt-5">
            {/* Variant selection */}
            {activeVariants.length > 1 && (
                <div className="mb-5">
                    <div className="flex flex-wrap gap-2">
                        {activeVariants.map((v) => {
                            const isPurchasable = isVariantPurchasable(v);
                            const isSelected = selectedVariant?.id === v.id;
                            return (
                                <button
                                    key={v.id}
                                    onClick={() => onVariantSelect(v)}
                                    disabled={!isPurchasable}
                                    className={`px-5 py-2 rounded-full border text-sm font-bold transition-all ${
                                        isSelected
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                                            : isPurchasable
                                                ? 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                    }`}
                                >
                                    {formatUnitType(v.unitType)}
                                    {!isPurchasable && (
                                        <span className="ml-1 text-[10px] text-red-400 font-bold no-underline">Hết</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Available stock info */}
            {selectedVariant && (selectedVariant.availableQuantity != null || flashSale) && (
                <p className="text-xs text-gray-400 font-medium mb-3">
                    {maxQuantity > 0
                        ? <span className="text-emerald-600 font-bold">Còn {maxQuantity} sản phẩm</span>
                        : <span className="text-red-500 font-bold">Hết hàng</span>
                    }
                </p>
            )}

            {selectedVariant && (
                <div className="mb-5">
                    {flashSale && (
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-red-600">
                            Flash sale
                            <span className="text-red-500">- {formatVND(flashSale.flashPrice)}</span>
                        </div>
                    )}
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-3xl font-black tracking-tight ${flashSale ? "text-red-600" : "text-emerald-600"}`}>
                            {formatVND(flashSale?.flashPrice ?? selectedVariant.salePrice)} <span className="text-xl font-bold">₫</span>
                        </span>
                        {flashSale && flashSale.originalPrice != null && flashSale.originalPrice > flashSale.flashPrice && (
                            <span className="text-sm font-semibold text-gray-400 line-through">
                                {formatVND(flashSale.originalPrice)}
                            </span>
                        )}
                        <span className="text-sm text-gray-400 font-medium">
                            / {formatUnitType(selectedVariant.unitType)}
                        </span>
                    </div>
                    {selectedVariant.specification?.trim() && (
                        <p className="mt-2 text-sm font-semibold text-gray-500">
                            {selectedVariant.specification.trim()}
                        </p>
                    )}
                </div>
            )}

            {/* Quantity + Stock */}
            {!isOutOfStock && (
                <div className="flex items-center gap-6 mb-6">
                    <div>
                        <p className="text-sm font-bold text-gray-600 mb-2">Chọn số lượng</p>
                        <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-200">
                            <button
                                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1 || isProcessing}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-white rounded-full transition-all disabled:opacity-30"
                            >
                                <FaMinus className="text-xs" />
                            </button>
                            <span className="w-12 text-center text-lg font-bold text-gray-900">
                                {quantity}
                            </span>
                            <button
                                onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
                                disabled={quantity >= maxQuantity || isProcessing}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-white rounded-full transition-all disabled:opacity-30"
                            >
                                <FaPlus className="text-xs" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4">
                <button
                    onClick={onBuyNow}
                    disabled={!canPurchase}
                    className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 text-base"
                >
                    {isOutOfStock ? "Hết hàng" : "Chọn mua"}
                </button>
                <button
                    onClick={onAddToCart}
                    disabled={!canPurchase}
                    className="flex-1 py-4 bg-white text-emerald-600 font-bold rounded-2xl border-2 border-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 text-base"
                >
                    <FaShoppingBasket className="text-lg" />
                    {isProcessing ? "Đang xử lý..." : "Thêm vào giỏ"}
                </button>
            </div>
        </div>
    );
};
