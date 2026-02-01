import React from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaMinus, FaTrashAlt } from "react-icons/fa";
import type { CartItem as CartItemType } from "../types/domain";
import { useUpdateCartItem } from "../hooks/useUpdateCartItem";
import { useRemoveCartItem } from "../hooks/useRemoveCartItem";

interface Props {
    item: CartItemType;
}

export const CartItem: React.FC<Props> = ({ item }) => {
    const updateMutation = useUpdateCartItem();
    const removeMutation = useRemoveCartItem();
    const {
        productName, variantName, unit, slug, thumbnail, quantity, unitPrice, lineTotal,
        availableQuantity, selected
    } = item;

    const handleChangeQuantity = (newQty: number) => {
        if (newQty < 1) return;
        if (availableQuantity != null && newQty > availableQuantity) return;
        updateMutation.mutate({ itemId: item.id, quantity: newQty });
    };

    const handleToggleSelect = () => {
        updateMutation.mutate({ itemId: item.id, selected: !selected });
    };

    const priceFormatted = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(unitPrice);

    const totalFormatted = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(lineTotal);

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-4 hover:shadow-md transition-shadow group flex items-center gap-4">
            {/* Selection Checkbox */}
            <div className="flex-shrink-0">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={handleToggleSelect}
                    disabled={updateMutation.isPending}
                    className="w-6 h-6 rounded-lg border-2 border-gray-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-all disabled:opacity-50"
                />
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center flex-1">
                {/* Product Image */}
                <Link to={`/${slug}`} className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-50 group-hover:scale-[1.02] transition-transform duration-500">
                    {thumbnail ? (
                        <img src={thumbnail} alt={productName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                            P
                        </div>
                    )}
                </Link>

                <div className="flex-1 text-center md:text-left overflow-hidden">
                    <Link to={`/${slug}`}>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2">
                            {productName}
                        </h3>
                    </Link>
                    {/* Variant info */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {variantName && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {variantName}
                            </span>
                        )}
                        {unit && (
                            <span className="text-xs text-gray-400 font-medium">
                                Đơn vị: {unit}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">Đơn giá: <span className="text-emerald-600 font-medium">{priceFormatted}</span></p>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-center md:items-end gap-3">
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                        <button
                            onClick={() => handleChangeQuantity(quantity - 1)}
                            disabled={quantity <= 1 || updateMutation.isPending}
                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-all disabled:opacity-30"
                        >
                            <FaMinus className="text-xs" />
                        </button>
                        <span className="w-12 text-center font-bold text-gray-900">
                            {updateMutation.isPending ? "..." : quantity}
                        </span>
                        <button
                            onClick={() => handleChangeQuantity(quantity + 1)}
                            disabled={updateMutation.isPending || (availableQuantity != null && quantity >= availableQuantity)}
                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-all disabled:opacity-30"
                        >
                            <FaPlus className="text-xs" />
                        </button>
                    </div>
                    {availableQuantity != null && availableQuantity > 0 && (
                        <span className="text-[10px] text-gray-400 font-medium">
                            Còn {availableQuantity}
                        </span>
                    )}
                </div>

                {/* Subtotal */}
                <div className="min-w-[120px] text-center md:text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Thành tiền</p>
                    <p className="text-xl font-black text-gray-900">{totalFormatted}</p>
                </div>

                {/* Remove Action */}
                <button
                    onClick={() => removeMutation.mutate(item.id)}
                    disabled={removeMutation.isPending}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
                    title="Xóa khỏi giỏ hàng"
                >
                    <FaTrashAlt />
                </button>
            </div>
        </div>
    );
};
