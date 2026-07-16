import React from 'react';
import { PaymentInfo } from '../types/domain';

interface PaymentCardProps {
    payment: PaymentInfo;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ payment }) => {
    const getPaymentMethodLabel = (method: string) => {
        switch ((method || '').toUpperCase()) {
            case 'BANK_TRANSFER':
                return 'SePay';
            default:
                return method;
        }
    };

    const getPaymentStatusLabel = (status: string) => {
        switch ((status || '').toUpperCase()) {
            case 'INITIATED':
                return 'Chờ thanh toán';
            case 'PAID':
            case 'COMPLETED':
                return 'Đã thanh toán';
            case 'PARTIAL':
                return 'Thanh toán một phần';
            case 'PENDING':
                return 'Chờ thanh toán';
            case 'REFUNDED':
                return 'Đã hoàn tiền';
            case 'FAILED':
                return 'Thanh toán thất bại';
            case 'CANCELLED':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin thanh toán</h3>
            </div>

            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Phương thức:</span>
                    <span className="font-medium text-gray-900">{getPaymentMethodLabel(payment.method)}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Số tiền:</span>
                    <span className="font-semibold text-gray-900">{payment.amount.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${payment.status?.toUpperCase() === 'PAID' || payment.status?.toUpperCase() === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        payment.status?.toUpperCase() === 'REFUNDED' ? 'bg-orange-100 text-orange-700' :
                            payment.status?.toUpperCase() === 'FAILED' || payment.status?.toUpperCase() === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}>
                        {getPaymentStatusLabel(payment.status)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PaymentCard;
