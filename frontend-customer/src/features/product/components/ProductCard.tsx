import { Link } from "react-router-dom"
import { FaCapsules } from "react-icons/fa6"
import { FaMinus, FaPlus } from "react-icons/fa"
import type { Product } from "../types/domain"
import { useRef, useEffect } from "react"
import { hasAvailableStock } from "../services/product.service"
import { formatUnitType, formatVND, getDisplayVariantStock, getEffectiveVariantPrice, getLiveFlashSale, isVariantPurchasable } from "../product.utils"
import { useEventTracking } from "@/features/shared/hooks/useEventTracking"
import { EventType } from "@/features/shared/types/event"
import { useProductCardActions } from "../hooks/useProductCardActions"
import type { ProductSortBy } from "../services/product.service"

interface Props {
    product: Product
    disableViewTracking?: boolean
    showPurchaseControls?: boolean
    sortBy?: ProductSortBy
}

export const ProductCard = ({ product, disableViewTracking = false, showPurchaseControls = false, sortBy }: Props) => {
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
        if (disableViewTracking) {
            return;
        }

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
    }, [disableViewTracking, product.id, track]);

    const handleProductClick = () => {
        track(EventType.CLICK, product.id);
    };

    const inStock = hasAvailableStock(product.variants);
    const displayStock = selectedVariant ? getDisplayVariantStock(selectedVariant) : null;
    const flashSale = getLiveFlashSale(selectedVariant);

    return (
        <div ref={cardRef} className="bg-white p-4 md:p-5 rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group flex flex-col h-full relative">
            {/* Stock badge */}
            {!inStock && (
                <div className="absolute top-3 right-3 z-10">
                    <span className="text-[10px] font-black text-white bg-gray-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Hết hàng
                    </span>
                </div>
            )}

            <Link to={`/${product.slug}`} className="block" onClick={handleProductClick}>
                <div className={`aspect-square bg-gray-50/50 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500 ${!inStock ? 'opacity-60' : ''}`}>
                    {product.primaryImage ? (
                        <img
                            src={product.primaryImage}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                            <FaCapsules className="text-emerald-600 text-xl" />
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex-grow space-y-3">
                <Link to={`/${product.slug}`} onClick={handleProductClick}>
                    <h3 className="text-[13px] md:text-[14px] font-black text-gray-800 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                        {product.webName || product.name}
                    </h3>
                </Link>

                {showPurchaseControls && (
                    <>
                        <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap gap-1.5">
                                {activeVariants.map((variant) => {
                                    const isSelected = selectedVariant?.id === variant.id;
                                    const purchasable = isVariantPurchasable(variant);
                                    return (
                                        <button
                                            key={variant.id}
                                            type="button"
                                            onClick={() => selectVariant(variant)}
                                            disabled={!purchasable}
                                            className={`min-w-[78px] px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                                                isSelected
                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/15"
                                                    : purchasable
                                                        ? "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                                                        : "bg-gray-100 text-gray-400 border-gray-200 line-through cursor-not-allowed"
                                            }`}
                                        >
                                            <span className="text-[11px] leading-tight uppercase tracking-wide">{formatUnitType(variant.unitType)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedVariant && (
                            <div className="flex flex-col gap-1">
                                {flashSale && (
                                    <div className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                        Flash sale
                                    </div>
                                )}
                                <div className="flex items-baseline gap-1 flex-wrap">
                                    <span className="text-base md:text-lg font-black text-red-600">
                                        {formatVND(getEffectiveVariantPrice(selectedVariant))}
                                    </span>
                                    <span className="text-[10px] font-black text-red-600 uppercase">đ</span>
                                    {flashSale && flashSale.originalPrice != null && flashSale.originalPrice > flashSale.flashPrice && (
                                        <span className="text-[11px] font-bold text-gray-400 line-through">
                                            {formatVND(flashSale.originalPrice)}đ
                                        </span>
                                    )}
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

                        {selectedVariant && displayStock != null && (
                            <p className="text-[10px] font-bold text-gray-400">
                                {displayStock > 0
                                    ? <>Còn <span className="text-emerald-600">{displayStock}</span> sản phẩm</>
                                    : <span className="text-red-500">Hết hàng</span>}
                            </p>
                        )}
                    </>
                )}
            </div>

            {showPurchaseControls && (
                <div className="pt-4 mt-auto space-y-3">
                    <div className="flex items-center justify-between gap-3">
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

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            disabled={!canPurchase}
                            className="py-2.5 bg-emerald-600 text-white text-[12px] md:text-[13px] font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50"
                        >
                            {canPurchase ? "Mua ngay" : "Hết hàng"}
                        </button>
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={!canPurchase}
                            className="py-2.5 bg-white border border-emerald-600 text-emerald-600 text-[12px] md:text-[13px] font-bold rounded-xl hover:bg-emerald-50 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            Thêm vào giỏ
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
