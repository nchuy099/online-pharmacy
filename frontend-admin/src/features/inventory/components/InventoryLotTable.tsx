import React from 'react';
import { Action, Column, DataTable } from '../../../shared/components/ui';
import { InventoryLotRow } from '../types/domain';
import InventoryLotStatusBadge from './InventoryLotStatusBadge';

interface InventoryLotTableProps {
    lots: InventoryLotRow[];
    isLoading?: boolean;
    onViewTransactions?: (lot: InventoryLotRow) => void;
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-');

const InventoryLotTable = React.memo(({ lots, isLoading = false, onViewTransactions }: InventoryLotTableProps) => {
    const columns: Column<InventoryLotRow>[] = [
        {
            key: 'lotNumber',
            header: 'Số lô',
            render: (_value, row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-900">{row.lotNumber}</span>
                    <span className="text-xs text-slate-500">{row.productSku || '-'}</span>
                </div>
            ),
        },
        {
            key: 'expiryDate',
            header: 'Hạn dùng',
            render: (_value, row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-800">{formatDate(row.expiryDate)}</span>
                    <span className="text-xs text-slate-500">
                        {row.daysLeft == null ? '-' : row.daysLeft < 0 ? `Quá hạn ${Math.abs(row.daysLeft)} ngày` : `Còn ${row.daysLeft} ngày`}
                    </span>
                </div>
            ),
        },
        {
            key: 'receivedAt',
            header: 'Ngày nhập',
            render: (value) => formatDate(value),
        },
        {
            key: 'quantityOnHand',
            header: 'Tồn thực',
            render: (value) => toLocaleQuantity(value),
        },
        {
            key: 'quantityReserved',
            header: 'Đang giữ',
            render: (value) => toLocaleQuantity(value),
        },
        {
            key: 'quantityAvailable',
            header: 'Có thể bán',
            render: (value) => <span className="font-semibold text-emerald-700">{toLocaleQuantity(value)}</span>,
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (value) => <InventoryLotStatusBadge status={value} />,
        },
        {
            key: 'unitCost',
            header: 'Giá nhập',
            render: (value) => value != null ? `${value.toLocaleString('vi-VN')} đ` : '-',
        },
    ];

    const actions: Action<InventoryLotRow>[] = [
        {
            label: 'Giao dịch',
            onClick: (row) => onViewTransactions?.(row),
            className: 'px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-sm',
        },
    ];

    return <DataTable data={lots} columns={columns} actions={actions} isLoading={isLoading} emptyMessage="Chưa có lô hàng nào." />;
});

const toLocaleQuantity = (value?: number | null) => (value != null ? value.toLocaleString('vi-VN') : '0');

export default InventoryLotTable;
