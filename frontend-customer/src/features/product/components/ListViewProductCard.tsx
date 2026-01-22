import React from 'react';
import { Link } from 'react-router-dom';
import { FaMinus, FaPlus } from "react-icons/fa";
import type { Product } from '../types/domain';
import { useRef, useEffect } from 'react';
import { hasAvailableStock } from '../services/product.service';
import { formatUnitType, formatVND, isVariantPurchasable } from '../product.utils';
import { useEventTracking } from '@/features/shared/hooks/useEventTracking';
import { EventType } from '@/features/shared/types/event';
import { useProductCardActions } from '../hooks/useProductCardActions';
import type { ProductSortBy } from '../services/product.service';

interface Props {
    product: Product;
    showPurchaseControls?: boolean;
    sortBy?: ProductSortBy;
}

export const ListViewProductCard: React.FC<Props> = ({ product, showPurchaseControls = false, sortBy }) => {
    const { track } = useEventTracking();
    const cardRef = useRef<HTMLDivElement>(null);
    const hasViewed = useRef(false);
    const {
        activeVariants,
        selectedVariant,
        quantity,
        canDecreaseQuantity,
        canIncreaseQuantity,
        canPurchase,
        selectVariant,
        decreaseQuantity,
        increaseQuantity,
        handleAddToCart,
        handleBuyNow,
    } = useProductCardActions(product, sortBy);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasViewed.current) {
                        hasViewed.current = true;
                        track(EventType.VIEW, product.id);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [product.id, track]);

    const handleProductClick = () => {
        track(EventType.CLICK, product.id);
    };

    const inStock = hasAvailableStock(product.variants);

    return (
        <div ref={cardRef} className={`bg-white p-6 rounded-[32px] border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group flex gap-8 ${!inStock ? 'opacity-75' : ''}`}>
            <Link to={`/${product.slug}`} onClick={handleProductClick} className="w-48 h-48 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={product.primaryImage || ""} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </Link>
            <div className="flex-grow flex flex-col justify-between py-2">
                <div className="space-y-3">
                    <Link to={`/${product.slug}`} onClick={handleProductClick}>
                        <h3 className="text-xl font-bold text-[#001737] mb-3 group-hover:text-emerald-600 transition-colors line-clamp-1">
                            {product.webName || product.name}
                        </h3>
                    </Link>
                    {showPurchaseControls && (
                        <>
                            <div className="space-y-2 pt-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phân loại</p>
                                <div className="flex flex-wrap gap-2">
                                    {activeVariants.map((variant) => {
                                        const isSelected = selectedVariant?.id === variant.id;
                                        const purchasable = isVariantPurchasable(variant);
                                        return (
                                            <button
                                                key={variant.id}
                                                type="button"
                                                onClick={() => selectVariant(variant)}
                                                disabled={!purchasable}
                                                className={`min-w-[104px] px-3 py-2 rounded-2xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                                                    isSelected
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/15'
                                                        : purchasable
                                                            ? 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                                                            : 'bg-gray-100 text-gray-400 border-gray-200 line-through cursor-not-allowed'
                                                }`}
                                            >
                                                <span className="text-[12px] leading-tight uppercase tracking-wide">{formatUnitType(variant.unitType)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {selectedVariant && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-baseline gap-1 flex-wrap">
                                        <span className="text-2xl font-black text-red-600">{formatVND(selectedVariant.salePrice)}đ</span>
                                        <span className="text-sm font-black text-gray-500">/</span>
                                        <span className="text-sm font-black text-gray-700 uppercase tracking-wide">
                                            {formatUnitType(selectedVariant.unitType)}
                                        </span>
                                    </div>
                                    {selectedVariant.specification?.trim() && (
                                        <p className="text-[11px] font-bold text-gray-400">
                                            {selectedVariant.specification.trim()}
                                        </p>
                                    )}
                                </div>
                            )}
                            {selectedVariant?.availableQuantity != null && (
                                <p className="text-[11px] font-bold text-gray-400">
                                    {selectedVariant.availableQuantity > 0
                                        ? <>Còn <span className="text-emerald-600">{selectedVariant.availableQuantity}</span> sản phẩm</>
                                        : <span className="text-red-500">Hết hàng</span>}
                                </p>
                            )}
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Số lượng</span>
                                <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-200">
                                    <button
                                        type="button"
                                        onClick={decreaseQuantity}
                                        disabled={!canDecreaseQuantity || !canPurchase}
                                        className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-white rounded-full transition-all disabled:opacity-30"
                                    >
                                        <FaMinus className="text-[10px]" />
                                    </button>
                                    <span className="w-10 text-center text-sm font-black text-gray-900">{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={increaseQuantity}
                                        disabled={!canIncreaseQuantity || !canPurchase}
                                        className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-white rounded-full transition-all disabled:opacity-30"
                                    >
                                        <FaPlus className="text-[10px]" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {showPurchaseControls && (
                    <div className="flex items-center gap-4 mt-6">
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            disabled={!canPurchase}
                            className="px-8 py-3 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        {canPurchase ? "Mua ngay" : "Hết hàng"}
                    </button>
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!canPurchase}
                        className="px-8 py-3 bg-[#001737] text-white text-sm font-black rounded-xl hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            Thêm vào giỏ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
