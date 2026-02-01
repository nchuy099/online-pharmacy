import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import type { Order } from "../types/domain";
import type { OrderStatus, PaymentStatus } from "../types/order.constant";

interface OrderCardProps {
    order: Order;
}

const getStatusText = (status: OrderStatus) => {
    const statusMap: Record<string, string> = {
        PENDING: "Chờ xác nhận",
        PENDING_PAYMENT: "Chờ thanh toán",
        PROCESSING: "Đang xử lý",
        SHIPPING: "Đang giao",
        DELIVERED: "Đã giao",
        CANCELLED: "Đã hủy"
    };
    return statusMap[status] || status;
};

const getStatusStyles = (status: OrderStatus) => {
    const styleMap: Record<string, string> = {
        PENDING: "bg-yellow-50 text-yellow-600 border-yellow-200",
        PENDING_PAYMENT: "bg-amber-50 text-amber-600 border-amber-200",
        PROCESSING: "bg-indigo-50 text-indigo-600 border-indigo-200",
        SHIPPING: "bg-purple-50 text-purple-600 border-purple-200",
        DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-200",
        CANCELLED: "bg-red-50 text-red-600 border-red-200"
    };
    return styleMap[status] || "bg-gray-50 text-gray-600 border-gray-200";
};

const getPaymentStatusText = (status: PaymentStatus) => {
    const statusMap: Record<string, string> = {
        INITIATED: "Chờ thanh toán",
        COMPLETED: "Đã thanh toán",
        FAILED: "Thất bại"
    };
    return statusMap[status] || status;
};

const getPaymentStatusStyles = (status: PaymentStatus) => {
    const styleMap: Record<string, string> = {
        INITIATED: "text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md",
        COMPLETED: "text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md",
        FAILED: "text-red-600 bg-red-50 px-2 py-1 rounded-md"
    };
    return styleMap[status] || "text-gray-600 bg-gray-50 px-2 py-1 rounded-md";
};

export const OrderCard = ({ order }: OrderCardProps) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    const handleViewDetails = () => {
        navigate(`/orders/${order.id}`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND"
        }).format(amount);
    };

    const visibleItems = order.items?.slice(0, expanded ? order.items.length : 2) || [];
    const hasMoreContent = (order.items?.length || 0) > 2;

    return (
        <div
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
            onClick={handleViewDetails}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Mã đơn:</span>
                    <span className="text-base font-bold text-gray-900">#{order.orderCode || order.id}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusStyles(order.status)}`}>
                        {getStatusText(order.status)}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="space-y-4 mb-4">
                <div className="space-y-4">
                    {visibleItems.map((item, index) => {
                        const isMain = index === 0;
                        return (
                            <div key={`${item.variantId || item.productId}-${index}`} className={`flex gap-3 ${isMain ? 'items-start' : 'items-center ml-2'}`}>
                                <div className={`${isMain ? 'w-20 h-20' : 'w-14 h-14'} bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100`}>
                                    {item.productImageUrl ? (
                                        <img
                                            src={item.productImageUrl}
                                            alt={item.productName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center">
                                            No img
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h4 className={`text-sm font-medium text-gray-900 line-clamp-2 ${!isMain && 'text-gray-700'}`}>
                                            {item.productWebName || item.productName}
                                        </h4>
                                        <div className="text-xs text-gray-500 mt-1">
                                            <span>#{item.productId}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-sm text-gray-500">x{item.quantity}</span>
                                        {isMain && (
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatCurrency(item.unitPrice)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-gray-50">
                    <div>
                        {hasMoreContent ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpanded(!expanded);
                                }}
                                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors py-1 pl-2"
                            >
                                {expanded ? "Ẩn bớt" : "Xem thêm"}
                                {expanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                            </button>
                        ) : (
                            <div />
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold ${getPaymentStatusStyles(order.payment.status)} py-0.5 px-2 mr-2`}>
                            {getPaymentStatusText(order.payment.status)}
                        </span>
                        <span className="text-sm text-gray-500">Tổng:</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(order.finalAmount)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails();
                    }}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-semibold hover:bg-emerald-700 transition-all hover:shadow-md"
                >
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
};
