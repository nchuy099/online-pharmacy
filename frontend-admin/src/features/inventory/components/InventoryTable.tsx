import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Action, Column, DataTable } from '../../../shared/components/ui';
import { InventorySummaryRow } from '../types/domain';
import InventoryStatusBadge from './InventoryStatusBadge';

interface InventoryTableProps {
    inventories: InventorySummaryRow[];
    isLoading?: boolean;
    onImport?: (row: InventorySummaryRow) => void;
}

const InventoryTable = React.memo(({ inventories, isLoading = false, onImport }: InventoryTableProps) => {
    const navigate = useNavigate();
    const rows = inventories.map((inv) => ({ ...inv }));
    const formatMoney = (value?: number | null) => (value != null ? `${value.toLocaleString('vi-VN')} đ` : '-');

    const columns: Column<InventorySummaryRow>[] = [
        {
            key: 'productName',
            header: 'Sản phẩm',
            width: '220px',
            render: (_v, row) => (
                <div className="flex flex-col gap-0.5 w-[220px]">
                    <span
                        className="font-medium text-gray-900 leading-tight truncate"
                        title={row.productWebName || row.productName}
                    >
                        {row.productWebName || row.productName}
                    </span>
                    <div className="flex items-center gap-2 group">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 italic transition-colors group-hover:text-slate-600 group-hover:bg-white truncate max-w-[180px]" title={row.productCode || row.productSku}>
                            {row.productCode || row.productSku || 'N/A'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'specification',
            header: 'Biến thể',
            render: (_v, row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-800">{row.specification || row.unitType || 'Mặc định'}</span>
                    <span className="text-xs text-slate-500">SKU: {row.productSku || '-'}</span>
                </div>
            )
        },
        {
            key: 'quantityOnHand',
            header: 'Tổng tồn',
            render: (v) => formatQuantity(v),
            width: '120px',
        },
        {
            key: 'quantityReserved',
            header: 'Đang giữ',
            render: (v) => formatQuantity(v),
            width: '120px',
        },
        {
            key: 'quantityAvailable',
            header: 'Có thể bán',
            render: (v) => <span className="text-emerald-700 font-semibold">{formatQuantity(v)}</span>,
            width: '120px',
        },
        {
            key: 'averageImportCost',
            header: 'Giá nhập TB',
            render: (_v, row) => <span className="text-sm font-medium text-slate-800">{formatMoney(row.averageImportCost)}</span>,
        },
        {
            key: 'salePrice',
            header: 'Giá bán',
            render: (_v, row) => <span className="text-sm font-medium text-slate-800">{formatMoney(row.salePrice)}</span>,
        },
        {
            key: 'stockStatus',
            header: 'Trạng thái',
            render: (value) => <InventoryStatusBadge status={value} />,
        },
    ];

    const actions: Action<InventorySummaryRow>[] = [
        {
            label: 'Xem lô',
            onClick: (row) => navigate(`/inventories/${row.variantId}/lots`),
            className: 'px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-sm',
        },
        {
            label: 'Giao dịch',
            onClick: (row) => navigate(`/inventories/${row.variantId}/transactions`),
            className: 'px-3 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-sm',
        },
        {
            label: 'Nhập kho',
            onClick: (row) => onImport?.(row),
            className: 'px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-sm',
        },
    ];

    return <DataTable data={rows} columns={columns} actions={actions} isLoading={isLoading} />;
});

const formatQuantity = (value?: number | null) => (value != null ? value.toLocaleString('vi-VN') : '0');

export default InventoryTable;
