import React from "react";
import { FaTrashAlt, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import { useClearCart } from "../hooks/useClearCart";

type Props = {
    grandTotal: number;
    totalDistinctItems: number;
    onCheckout: () => void;
    isCartEmpty: boolean;
};

export const CartSummary: React.FC<Props> = ({ grandTotal, totalDistinctItems, onCheckout, isCartEmpty }) => {
    const clearMutation = useClearCart();

    const amountFormatted = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(grandTotal);

    return (
        <div className="lg:sticky lg:top-24 fixed bottom-0 left-0 right-0 lg:static z-40 lg:z-auto">
            <div className="bg-white lg:rounded-3xl p-6 lg:p-8 border-t lg:border border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] lg:shadow-sm space-y-4 lg:space-y-6">
                <div className="hidden lg:block">
                    <h2 className="text-2xl font-bold text-gray-900 font-primary">Tổng cộng</h2>
                </div>

                <div className="space-y-3 lg:space-y-4">
                    <div className="hidden lg:flex justify-between items-center text-gray-600">
                        <span className="font-medium">Số lượng sản phẩm ({totalDistinctItems} được chọn)</span>
                        <span className="font-bold text-gray-900">{totalDistinctItems}</span>
                    </div>
                    {/* Compact Mobile Row */}
                    <div className="flex lg:hidden justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-500">{totalDistinctItems} sản phẩm được chọn</span>
                        <button
                            onClick={() => clearMutation.mutate()}
                            disabled={isCartEmpty || clearMutation.isPending}
                            className="text-xs font-bold text-red-500 hover:text-red-600"
                        >
                            Xóa hết
                        </button>
                    </div>

                    <div className="hidden lg:flex justify-between items-center text-gray-600">
                        <span className="font-medium">Tạm tính</span>
                        <span className="font-bold text-gray-900">{amountFormatted}</span>
                    </div>

                    <div className="pt-2 lg:pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center lg:items-end mb-2">
                            <span className="font-bold text-gray-900 lg:text-base text-sm">Tổng cộng</span>
                            <div className="text-right">
                                <span className="text-2xl lg:text-3xl font-black text-emerald-600">{amountFormatted}</span>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block lg:hidden">
                                    Đã bao gồm VAT
                                </p>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 text-right font-bold uppercase tracking-widest hidden lg:block">
                            (Đã bao gồm Thuế VAT)
                        </p>
                    </div>
                </div>

                <div className="flex lg:flex-col gap-3 pt-2 lg:pt-4">
                    <button
                        onClick={onCheckout}
                        disabled={totalDistinctItems === 0}
                        className="flex-1 lg:w-full py-4 lg:py-5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-gray-900"
                    >
                        Tiến hành đặt hàng
                        <FaArrowRight className="text-sm hidden lg:block" />
                    </button>

                    <button
                        onClick={() => clearMutation.mutate()}
                        disabled={isCartEmpty || clearMutation.isPending}
                        className="hidden lg:flex w-full py-4 text-gray-500 font-bold rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all items-center justify-center gap-2"
                    >
                        <FaTrashAlt className="text-xs" />
                        Xóa giỏ hàng
                    </button>
                </div>

                <div className="hidden lg:flex bg-emerald-50 rounded-2xl p-4 items-start gap-3">
                    <FaShieldAlt className="text-emerald-600 mt-1 flex-shrink-0" />
                    <p className="text-xs text-emerald-800 leading-relaxed">
                        Thanh toán an toàn & bảo mật. Cam kết thuốc chính hãng 100%, có hóa đơn đầy đủ.
                    </p>
                </div>
            </div>
        </div>
    );
};