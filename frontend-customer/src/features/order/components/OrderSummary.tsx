import React from "react";
import { FaFileAlt } from "react-icons/fa";

interface Props {
    amountFormatted: string;
    shippingFee?: number;
}

export const OrderSummary: React.FC<Props> = ({ amountFormatted, shippingFee }) => {
    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm md:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FaFileAlt className="text-emerald-600" />
                Tổng kết đơn hàng
            </h2>
            <div className="space-y-4 max-w-md ml-auto">
                <div className="flex justify-between items-center text-gray-600">
                    <span className="font-medium">Tạm tính</span>
                    <span className="font-bold text-gray-900">{amountFormatted}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                    <span className="font-medium">Phí vận chuyển</span>
                    {shippingFee && shippingFee > 0 ? (
                        <span className="font-bold text-gray-900">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(shippingFee)}
                        </span>
                    ) : (
                        <span className="text-emerald-600 font-bold uppercase text-xs tracking-widest">Miễn phí</span>
                    )}
                </div>
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-end">
                        <span className="font-black text-gray-900 text-lg">Tổng thanh toán</span>
                        <span className="text-3xl font-black text-emerald-600 leading-none">{amountFormatted}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
