import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Column, DataTable, Action } from '../../../shared/components/ui';
import { InventoryVariantRow } from '../types/domain';

interface InventoryTableProps {
    inventories: InventoryVariantRow[];
    isLoading?: boolean;
}

const InventoryTable = React.memo(({ inventories, isLoading = false }: InventoryTableProps) => {
    const navigate = useNavigate();
    const rows = inventories.map((inv) => ({ ...inv }));
    const formatMoney = (value?: number | null) => (value != null ? `${value.toLocaleString()} đ` : '-');

    const columns: Column<any>[] = [
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
            key: 'variantName',
            header: 'Phân loại',
            render: (_v, row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-800">{row.specification || row.unitType || 'Mặc định'}</span>
                    <span className="text-xs text-slate-500">SKU: {row.productSku || '-'}</span>
                </div>
            )
        },
        {
            key: 'averageImportCost',
            header: 'Giá nhập trung bình',
            render: (_v, row) => {
                const importCost = row.averageImportCost;

                return <span className="text-sm font-medium text-slate-800">{formatMoney(importCost)}</span>;
            }
        },
        {
            key: 'salePrice',
            header: 'Giá bán',
            render: (_v, row) => {
                const salePrice = row.salePrice || 0;
                return <span className="text-sm font-medium text-slate-800">{formatMoney(salePrice)}</span>;
            }
        },
        {
            key: 'quantityOnHand',
            header: 'Tổng tồn',
            render: (v: any) => (v != null ? v.toLocaleString() : '0'),
            width: '120px',
        },
        {
            key: 'quantityAvailable',
            header: 'Có thể bán',
            render: (v: any) => (v != null ? v.toLocaleString() : '0'),
            width: '120px',
        },
        {
            key: 'quantityReserved',
            header: 'Đang giữ',
            render: (v: any) => (v != null ? v.toLocaleString() : '0'),
            width: '120px',
        },
    ];

    const actions: Action<any>[] = [
        {
            label: 'Chi tiết kho',
            onClick: (row) => navigate(`/inventories/${row.variantId}/transactions`),
            className: 'px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-sm',
        },
    ];

    return <DataTable data={rows} columns={columns} actions={actions} isLoading={isLoading} />;
});

export default InventoryTable;
