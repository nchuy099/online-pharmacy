import { FaCheckCircle, FaShoppingBag, FaFileAlt, FaUniversity, FaArrowRight, FaTruck, FaShieldAlt } from "react-icons/fa";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import type { Order } from "../types/domain";
import { getOrderDisplayCode } from "../utils/paymentDisplay";

export const OrderSuccessPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const [orderData, setOrderData] = useState<Order | null>(null);

    useEffect(() => {
        if (location.state?.orderData) {
            setOrderData(location.state.orderData);
        } else if (!id) {
            navigate("/products");
        }
    }, [id, location.state, navigate]);

    if (!id) return null;

    const isBankTransfer = orderData?.payment?.method === "BANK_TRANSFER";
    const isPaid = orderData?.status === "PROCESSING" || orderData?.status === "SHIPPING" || orderData?.status === "DELIVERED" || orderData?.payment?.status === "COMPLETED";
    const showPaymentButton = isBankTransfer && !isPaid;
    const displayCode = orderData ? getOrderDisplayCode(orderData) : id;

    return (
        <div className="min-h-screen bg-[#F1F5F9] py-8 px-6">
            <div className="max-w-7xl mx-auto flex flex-col items-center">
                <div className="max-w-2xl w-full bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-emerald-500/5 border border-white relative overflow-hidden text-center">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-40 translate-x-32 -translate-y-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-40 -translate-x-32 translate-y-32"></div>

                    {/* Success Icon Animation */}
                    <div className="relative mb-8">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-in zoom-in duration-700">
                            <FaCheckCircle className="text-white text-4xl" />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-emerald-100 rounded-full animate-ping opacity-20"></div>
                    </div>

                    {/* Content */}
                    <h1 className="text-[32px] font-black text-[#001737] mb-3 leading-tight">
                        Đặt hàng <span className="text-emerald-500">thành công!</span>
                    </h1>

                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mã đơn hàng</span>
                        <span className="text-base font-black text-[#001737] font-mono">#{displayCode}</span>
                    </div>

                    <p className="text-slate-500 text-[15px] mb-8 max-w-md mx-auto leading-relaxed font-medium">
                        Cảm ơn bạn đã tin tưởng SmartPharma. Chúng tôi đã nhận được đơn hàng và đang xử lý ngay.
                    </p>

                    {/* Order Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4 text-left transition-all hover:border-emerald-200">
                            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-slate-50">
                                <FaTruck className="text-lg" />
                            </div>
                            <div>
                                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Giao hàng</p>
                                <p className="text-[13px] font-extrabold text-[#001737]">Dự kiến 2-3 ngày</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4 text-left transition-all hover:border-emerald-200">
                            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-slate-50">
                                <FaShieldAlt className="text-lg" />
                            </div>
                            <div>
                                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Bảo hành</p>
                                <p className="text-[13px] font-extrabold text-[#001737]">Chính hãng 100%</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        {showPaymentButton && (
                            <button
                                onClick={() => navigate(`/orders/${id}/payment`)}
                                className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-3 active:scale-[0.98] group"
                            >
                                <FaUniversity className="text-xl" />
                                Thanh toán ngay
                                <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate(`/orders/${id}`)}
                                className="w-full py-4 bg-[#001737] text-white font-black text-[14px] rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-slate-200"
                            >
                                <FaFileAlt className="text-sm" />
                                Xem đơn hàng
                            </button>
                            <button
                                onClick={() => navigate("/products")}
                                className="w-full py-4 bg-white text-[#001737] font-black text-[14px] rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <FaShoppingBag className="text-sm" />
                                Mua sắm tiếp
                            </button>
                        </div>
                    </div>

                    <p className="mt-10 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                        SmartPharma • Kiểm tra email xác nhận
                    </p>
                </div>
            </div>
        </div>
    );
};
