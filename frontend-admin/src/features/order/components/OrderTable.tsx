import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Action, Column, DataTable } from '../../../shared/components/ui';
import { Order } from '../types/domain';

interface OrderTableProps {
    orders: Order[];
    isLoading?: boolean;
}

const OrderTable = React.memo(({ orders, isLoading = false }: OrderTableProps) => {
    const navigate = useNavigate();
    const rows = orders.map((o) => ({ ...o, id: o.id }));
    const getPaymentMethodLabel = (method: string) => {
        switch ((method || '').toUpperCase()) {
            case 'BANK_TRANSFER':
                return 'SePay';
            default:
                return method;
        }
    };


    const columns: Column<any>[] = [
        {
            key: 'orderCode',
            header: 'Mã đơn hàng',
            render: (value) => (
                <div className="flex items-center gap-2 group">
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-50/50 px-2 py-0.5 rounded-md border border-slate-100 transition-colors group-hover:bg-white group-hover:text-amber-600" title="Click để copy">
                        {value}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(value);
                        }}
                        className="p-1 hover:bg-amber-50 rounded text-slate-300 hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy mã đơn hàng"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (v) => {
                const colors = {
                    PENDING: 'bg-yellow-100 text-yellow-700',
                    PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
                    PROCESSING: 'bg-indigo-100 text-indigo-700',
                    SHIPPING: 'bg-purple-100 text-purple-700',
                    DELIVERED: 'bg-green-100 text-green-700',
                    CANCELLED: 'bg-red-100 text-red-700'
                };
                const labels = {
                    PENDING: 'Chờ xác nhận',
                    PENDING_PAYMENT: 'Chờ thanh toán',
                    PROCESSING: 'Đang xử lý',
                    SHIPPING: 'Đang giao',
                    DELIVERED: 'Đã giao',
                    CANCELLED: 'Đã hủy'
                };
                return (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${colors[v as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
                        {labels[v as keyof typeof labels] || v}
                    </span>
                );
            }
        },
        {
            key: 'paymentMethod',
            header: 'P.Thức T.Toán',
            render: (v: string) => getPaymentMethodLabel(v)
        },
        { key: 'finalAmount', header: 'Tổng tiền', render: (v: any) => (v != null ? v.toLocaleString('vi-VN') + ' đ' : '-') },
    ];

    const actions: Action<any>[] = [
        {
            label: 'Chi tiết',
            onClick: (row) => navigate(`/orders/${row.id}`),
            className: 'px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100'
        }
    ];

    return <DataTable data={rows} columns={columns} actions={actions} isLoading={isLoading} />;

});

export default OrderTable;
