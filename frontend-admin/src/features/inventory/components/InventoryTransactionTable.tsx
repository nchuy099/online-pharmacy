import { Column, DataTable } from '../../../shared/components/ui';
import { InventoryTransaction } from '../types/domain';

interface Props {
    transactions: InventoryTransaction[];
    isLoading?: boolean;
}

const TRANSACTION_LABELS: Record<string, { label: string; className: string }> = {
    IMPORT: { label: 'NHẬP KHO', className: 'bg-blue-100 text-blue-700' },
    EXPORT: { label: 'XUẤT KHO', className: 'bg-rose-100 text-rose-700' },
    RESERVE: { label: 'GIỮ HÀNG', className: 'bg-amber-100 text-amber-700' },
    RELEASE: { label: 'NHẢ GIỮ', className: 'bg-slate-100 text-slate-700' },
    ADJUST: { label: 'ĐIỀU CHỈNH', className: 'bg-violet-100 text-violet-700' },
    EXPIRE: { label: 'HẾT HẠN', className: 'bg-rose-100 text-rose-700' },
};

const InventoryTransactionTable = ({ transactions, isLoading }: Props) => {
    const columns: Column<InventoryTransaction>[] = [
        {
            key: 'createdAt',
            header: 'Thời gian',
            render: (value) => <span className="text-slate-500 whitespace-nowrap">{value ? new Date(value).toLocaleString('vi-VN') : '-'}</span>,
        },
        {
            key: 'productName',
            header: 'Sản phẩm / biến thể',
            render: (_value, item) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-900">{item.productName || '-'}</span>
                    <span className="text-xs text-slate-500">
                        {(item.specification || item.unitType || '-') + ' • SKU: ' + (item.variantSku || '-')}
                    </span>
                </div>
            ),
        },
        {
            key: 'lotNumber',
            header: 'Số lô',
            render: (value) => value || '-',
        },
        {
            key: 'type',
            header: 'Loại giao dịch',
            render: (value) => {
                const config = TRANSACTION_LABELS[value] || { label: value, className: 'bg-slate-100 text-slate-700' };
                return (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
                        {config.label}
                    </span>
                );
            }
        },
        {
            key: 'quantity',
            header: 'Số lượng',
            render: (value, item) => {
                const isNegativeFlow = item.type === 'RESERVE' || item.type === 'EXPORT' || item.type === 'EXPIRE';
                return <span className={`font-semibold ${isNegativeFlow ? 'text-rose-600' : 'text-emerald-700'}`}>{`${isNegativeFlow ? '-' : '+'}${Math.abs(value)}`}</span>;
            }
        },
        {
            key: 'note',
            header: 'Ghi chú',
            render: (value) => value || '-',
        },
    ];

    return (
        <DataTable<InventoryTransaction>
            data={transactions}
            columns={columns}
            emptyMessage="Chưa có giao dịch kho nào."
            isLoading={isLoading}
        />
    );
};

export default InventoryTransactionTable;
