import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaClock, FaCopy, FaShieldAlt, FaUniversity } from "react-icons/fa";
import { useOrderDetails } from "../hooks/useOrderDetails";
import { getOrderDisplayCode, getSePayQrUrl } from "../utils/paymentDisplay";

export const PaymentPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: order, isLoading, refetch } = useOrderDetails(id);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    // Polling for status update
    useEffect(() => {
        if (!order || order.status === "PROCESSING" || order.status === "SHIPPING" || order.status === "DELIVERED" || (order.payment && order.payment.status === "COMPLETED")) return;

        const interval = setInterval(() => {
            refetch();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [order, refetch]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium font-primary">Đang tải thông tin thanh toán...</p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    if (order.status === "PROCESSING" || order.status === "SHIPPING" || order.status === "DELIVERED" || (order.payment && order.payment.status === "COMPLETED")) {
        navigate(`/orders/${order.id}/success`, { state: { orderData: order } });
        return null;
    }

    const displayCode = getOrderDisplayCode(order);
    const paymentQrUrl = getSePayQrUrl(order);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-600 hover:text-emerald-600 hover:shadow-md transition-all shrink-0"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 font-primary">Thanh toán đơn hàng</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Mã đơn: #{displayCode}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* QR Section */}
                    <div className="lg:col-span-7 flex flex-col items-center">
                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 w-full flex flex-col items-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full"></div>
                                <div className="relative w-64 h-64 bg-white p-4 rounded-3xl border-4 border-emerald-50 shadow-inner overflow-hidden">
                                    <img
                                        src={paymentQrUrl}
                                        alt="QR Thanh toán"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full font-bold text-sm mb-8">
                                <FaClock className="animate-pulse" />
                                <span>Tự động cập nhật sau: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 text-center">Nội dung chuyển khoản</p>
                                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-emerald-100">
                                        <p className="font-mono font-black text-emerald-600 text-3xl tracking-wider uppercase">{displayCode}</p>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(displayCode)}
                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                        >
                                            <FaCopy className="text-xl" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 text-center italic">
                                    * Vui lòng nhập <strong>chính xác</strong> nội dung chuyển khoản để hệ thống tự động xác nhận.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 font-primary">
                                <FaUniversity className="text-emerald-600" />
                                Thông tin tài khoản
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Ngân hàng</p>
                                    <p className="font-bold text-gray-900">{order.bankName || "MB Bank"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Số tài khoản</p>
                                    <p className="text-xl font-black text-gray-900">{order.bankAccount || "0123499999"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Chủ tài khoản</p>
                                    <p className="font-bold text-gray-900">SMART PHARMA CO., LTD</p>
                                </div>
                                <div className="pt-6 border-t border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Số tiền cần thanh toán</p>
                                    <p className="text-3xl font-black text-emerald-600">
                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.finalAmount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-start gap-4">
                            <FaShieldAlt className="text-emerald-600 text-2xl mt-1 shrink-0" />
                            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                                Hệ thống sẽ tự động xác nhận đơn hàng ngay khi nhận được thanh toán.
                                Bạn không cần phải gửi ảnh minh chứng giao dịch.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm"
                        >
                            Quay lại đơn hàng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
