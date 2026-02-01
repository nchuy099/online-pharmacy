import React from "react";
import { FaCreditCard, FaUniversity, FaCopy } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import type { Order } from "../types/domain";
import { getOrderDisplayCode, getSePayQrUrl } from "../utils/paymentDisplay";

interface Props {
    order: Order;
    paymentStatusConfig: {
        label: string;
        color: string;
    };
}

export const OrderPaymentInfo: React.FC<Props> = ({ order, paymentStatusConfig }) => {
    const navigate = useNavigate();
    const displayCode = getOrderDisplayCode(order);
    const paymentQrUrl = getSePayQrUrl(order);

    return (
        <>
            {/* Payment Info */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FaCreditCard className="text-emerald-600" />
                    Thông tin thanh toán
                </h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phương thức</span>
                        <span className="font-bold text-gray-900">
                            {order.payment?.method === "COD" ? "COD" :
                                order.payment?.method === "BANK_TRANSFER" ? "Chuyển khoản SePay" : "VNPay"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Trạng thái</span>
                        <span className={`font-bold ${paymentStatusConfig.color}`}>{paymentStatusConfig.label}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Số tiền</span>
                        <span className="font-bold text-gray-900">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.payment?.amount || order.finalAmount)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bank Transfer Instructions for Pending Orders */}
            {order.payment?.method === "BANK_TRANSFER" && order.payment?.status === "INITIATED" && (
                <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 shadow-sm md:col-span-2">
                    <h2 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-3">
                        <FaUniversity className="text-emerald-600" />
                        Hướng dẫn thanh toán chuyển khoản
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-emerald-200">
                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-3 text-center">Nội dung chuyển khoản</p>
                                <div className="flex justify-between items-center gap-4">
                                    <p className="font-mono font-black text-emerald-600 text-3xl tracking-wider">{displayCode}</p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(displayCode)}
                                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all font-primary font-bold text-xs"
                                        title="Sao chép nội dung"
                                    >
                                        <FaCopy className="text-xl" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Ngân hàng</p>
                                    <p className="font-bold text-sm text-gray-900">MB Bank</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Số tài khoản</p>
                                    <p className="font-bold text-sm text-gray-900">0123499999</p>
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-100/50 rounded-2xl border border-dashed border-emerald-300 text-center">
                                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                                    Hệ thống sẽ tự động xác nhận sau 1-5 phút khi nhận được chính xác nội dung chuyển khoản trên.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate(`/orders/${order.id}/payment`)}
                                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100"
                            >
                                <FaUniversity className="text-xl" />
                                Thanh toán bằng QR
                            </button>
                        </div>

                            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-emerald-100">
                            <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-emerald-50 mb-4 overflow-hidden">
                                <img
                                    src={paymentQrUrl}
                                    alt="QR Thanh toán"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase text-center">Quét mã QR để thanh toán nhanh</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
