import React from 'react';
import { DataTable, Column } from '../../../shared/components/ui';
import { OrderItem, OrderItemInventoryAllocation } from '../types/domain';

interface OrderInventoryAllocationPanelProps {
    items?: OrderItem[];
    allocations: OrderItemInventoryAllocation[];
    isLoading?: boolean;
}

type AllocationRow = OrderItemInventoryAllocation & {
    productName: string;
    orderedQuantity: number;
};

const OrderInventoryAllocationPanel: React.FC<OrderInventoryAllocationPanelProps> = ({ items = [], allocations, isLoading = false }) => {
    const rows: AllocationRow[] = allocations.map((allocation) => {
        const orderItem = items.find((item) => item.id === allocation.orderItemId);
        return {
            ...allocation,
            productName: orderItem?.productName || 'Sản phẩm không xác định',
            orderedQuantity: orderItem?.quantity || 0,
        };
    });

    const columns: Column<AllocationRow>[] = [
        {
            key: 'productName',
            header: 'Order item',
            render: (_value, row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-900">{row.productName}</span>
                    <span className="text-xs text-slate-500">SL đặt: {row.orderedQuantity}</span>
                </div>
            ),
        },
        {
            key: 'lotNumber',
            header: 'Số lô',
            render: (value, row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-800">{value || '-'}</span>
                    <span className="text-xs text-slate-500">
                        HSD: {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('vi-VN') : '-'}
                    </span>
                </div>
            ),
        },
        {
            key: 'reservedQuantity',
            header: 'Đã giữ',
            render: (value) => <span className="font-semibold text-amber-700">{value}</span>,
        },
        {
            key: 'exportedQuantity',
            header: 'Đã xuất',
            render: (value) => <span className="font-semibold text-emerald-700">{value}</span>,
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (value) => value || '-',
        },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-900">Inventory Allocation</h3>
                <p className="text-sm text-slate-500 mt-1">Theo dõi order item đã reserve và export từ lô nào.</p>
            </div>
            <div className="p-6">
                <DataTable
                    data={rows}
                    columns={columns}
                    isLoading={isLoading}
                    emptyMessage="Chưa có dữ liệu allocation cho đơn hàng này."
                />
            </div>
        </div>
    );
};

export default OrderInventoryAllocationPanel;
