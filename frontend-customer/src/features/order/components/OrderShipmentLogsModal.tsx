import React from "react";
import { FaTimes, FaTruck, FaBoxOpen, FaShippingFast, FaCheckCircle, FaMapMarkerAlt } from "react-icons/fa";
import type { ShipmentInfo } from "../types/domain";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    shipment?: ShipmentInfo;
}

const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("pick")) return <FaBoxOpen className="text-blue-500" />;
    if (s.includes("stor") || s.includes("warehouse")) return <FaMapMarkerAlt className="text-orange-500" />;
    if (s.includes("deliver") || s.includes("ship")) return <FaShippingFast className="text-purple-500" />;
    if (s.includes("finish") || s.includes("success") || s.includes("delivered")) return <FaCheckCircle className="text-emerald-500" />;
    return <FaTruck className="text-gray-400" />;
};

const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
        "ready_to_pick": "Sẵn sàng lấy hàng",
        "picking": "Đang lấy hàng",
        "cancel": "Đã hủy",
        "money_collect_picking": "Đang thu tiền người gửi",
        "picked": "Đã lấy hàng",
        "storing": "Đang lưu kho",
        "transporting": "Đang luân chuyển",
        "sorting": "Đang phân loại",
        "delivering": "Đang giao hàng",
        "money_collect_delivering": "Đang thu tiền người nhận",
        "delivered": "Giao hàng thành công",
        "delivery_fail": "Giao hàng thất bại",
        "waiting_to_return": "Đang đợi trả hàng",
        "return": "Trả hàng",
        "return_transporting": "Đang luân chuyển trả hàng",
        "return_sorting": "Đang phân loại trả hàng",
        "returning": "Đang trả hàng",
        "returned": "Đã trả hàng",
        "exception": "Hàng ngoại lệ",
        "damage": "Hàng hư hỏng",
        "lost": "Hàng bị mất"
    };
    return statusMap[status.toLowerCase()] || status.toUpperCase();
};

export const OrderShipmentLogsModal: React.FC<Props> = ({ isOpen, onClose, shipment }) => {
    if (!isOpen) return null;

    const logs = shipment?.log || [];

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <FaTruck size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 leading-none">Hành trình đơn hàng</h3>
                            <p className="text-sm text-gray-400 mt-2 font-medium tracking-wide">
                                Mã vận đơn: <span className="text-emerald-600 font-bold">{shipment?.orderCode || "N/A"}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-4 -mr-4 py-4">
                    {logs.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <FaTruck className="text-gray-200 text-6xl mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">Chưa có thông tin hành trình</p>
                        </div>
                    ) : (
                        <div className="relative pl-8 border-l-2 border-emerald-100 space-y-10 ml-4 py-2">
                            {[...logs].reverse().map((log, index) => (
                                <div key={index} className="relative">
                                    <div className={`absolute -left-[45px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center overflow-hidden transition-all ${index === 0 ? 'bg-emerald-500 scale-125 z-10' : 'bg-white border-emerald-100'}`}>
                                        {index === 0 ? (
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        ) : (
                                            <div className="w-2 h-2 bg-emerald-200 rounded-full" />
                                        )}
                                    </div>
                                    <div className={`p-5 rounded-2xl border transition-all ${index === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusIcon(log.status)}
                                            <p className={`font-bold ${index === 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                                                {getStatusLabel(log.status)}
                                            </p>
                                        </div>
                                        <p className="text-[13px] text-gray-400 flex items-center gap-2">
                                            {new Date(log.updatedDate).toLocaleString('vi-VN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                        Đóng lại
                    </button>
                </div>
            </div>
        </div>
    );
};
