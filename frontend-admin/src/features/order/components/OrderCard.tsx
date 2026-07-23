import React from 'react';
import { OrderDetails } from '../types/domain';

interface OrderCardProps {
    order: OrderDetails;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin đơn hàng</h3>
                    <span className="text-xs font-mono text-gray-400">ID: {order.id}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    order.status === 'RETURN_REQUESTED' ? 'bg-orange-100 text-orange-700' :
                    order.status === 'RETURNED' ? 'bg-slate-100 text-slate-700' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    order.status === 'SHIPPING' ? 'bg-purple-100 text-purple-700' :
                    order.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-700' :
                    order.status === 'PENDING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                    (order.status as string) === 'PROCESSING' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {order.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' :
                     order.status === 'PENDING_CONFIRMATION' ? 'Chờ xác nhận' :
                     order.status === 'CONFIRMED' ? 'Đã xác nhận' :
                     (order.status as string) === 'PROCESSING' ? 'Đang xử lý' :
                     order.status === 'SHIPPING' ? 'Đang giao' :
                     order.status === 'DELIVERED' ? 'Đã giao' :
                     order.status === 'RETURN_REQUESTED' ? 'Yêu cầu trả hàng' :
                     order.status === 'RETURNED' ? 'Đã trả hàng' :
                     order.status === 'CANCELLED' ? 'Đã hủy' : order.status}
                </span>
            </div>

            <div className="p-6">
                <div className="space-y-4">
                    {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.productName}</p>
                                {item.productSlug && (
                                    <div className="flex items-center gap-2 group/slug mt-0.5">
                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 italic transition-colors group-hover/slug:text-slate-600 group-hover/slug:bg-white truncate max-w-[150px]" title={item.productSlug}>
                                            {item.productSlug}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(item.productSlug || '');
                                            }}
                                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition-colors opacity-0 group-hover/slug:opacity-100"
                                            title="Copy mã sản phẩm"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                                <p className="text-sm text-gray-500 mt-1">Số lượng: {item.quantity}</p>
                            </div>
                            <div className="text-right pl-4">
                                <p className="font-medium text-gray-900">{(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ</p>
                                <p className="text-xs text-gray-400">{item.unitPrice.toLocaleString('vi-VN')} đ / đơn vị</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                    {order.note && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Ghi chú:</span>
                            <span className="text-gray-900 italic">{order.note}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-base font-semibold text-gray-900">Tổng cộng:</span>
                        <span className="text-2xl font-bold text-blue-600">{order.finalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderCard;
