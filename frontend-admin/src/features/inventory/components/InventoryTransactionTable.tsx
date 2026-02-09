import { DataTable, Column } from '../../../shared/components/ui';
import { InventoryTransaction } from '../types/domain';

interface Props {
    transactions: InventoryTransaction[];
    isLoading?: boolean;
}

const InventoryTransactionTable = ({ transactions, isLoading }: Props) => {
    const columns: Column<InventoryTransaction>[] = [
        {
            key: 'type',
            header: 'Loại giao dịch',
            render: (value) => {
                let color = 'bg-gray-100 text-gray-700';
                let label = value;

                if (value === 'IMPORT') {
                    color = 'bg-blue-100 text-blue-700';
                    label = 'NHẬP KHO';
                } else if (value === 'EXPORT') {
                    color = 'bg-red-100 text-red-700';
                    label = 'XUẤT KHO';
                } else if (value === 'RESERVE') {
                    color = 'bg-orange-100 text-orange-700';
                    label = 'GIỮ HÀNG';
                } else if (value === 'RELEASE') {
                    color = 'bg-gray-100 text-gray-700';
                    label = 'HỦY GIỮ HÀNG';
                } else if (value === 'RETURN') {
                    color = 'bg-purple-100 text-purple-700';
                    label = 'TRẢ HÀNG';
                }

                return (
                    <span className={'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ' + color}>
                        {label}
                    </span>
                );
            }
        },
        {
            key: 'variantSku',
            header: 'Biến thể',
            render: (_value, item) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{item.specification || item.unitType || '-'}</span>
                    <span className="text-xs text-slate-500">SKU: {item.variantSku || '-'}</span>
                </div>
            )
        },
        {
            key: 'quantity',
            header: 'Số lượng',
            render: (value) => <span className="font-semibold">{value}</span>
        },
        {
            key: 'unitCost',
            header: 'Giá nhập giao dịch',
            render: (value) => (value == null ? '_' : (
                <span className="text-emerald-700 font-medium">
                    {value.toLocaleString('vi-VN')} đ
                </span>
            ))
        },
        {
            key: 'averageImportCost',
            header: 'Giá nhập TB',
            render: (value) => (value == null ? '_' : (
                <span className="text-slate-700 font-medium">
                    {value.toLocaleString('vi-VN')} đ
                </span>
            ))
        },
        {
            key: 'salePrice',
            header: 'Giá bán',
            render: (value) => (value == null ? '_' : (
                <span className="text-slate-700 font-medium">
                    {value.toLocaleString('vi-VN')} đ
                </span>
            ))
        },
        { key: 'note', header: 'Ghi chú' },
        {
            key: 'createdAt',
            header: 'Thời điểm giao dịch',
            render: (value) => (
                <span className="text-gray-500 whitespace-nowrap">
                    {value ? new Date(value).toLocaleString('vi-VN') : '-'}
                </span>
            )
        },
    ];

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500">Đang tải giao dịch...</p>
            </div>
        );
    }

    return (
        <DataTable<InventoryTransaction>
            data={transactions}
            columns={columns}
            emptyMessage="Chưa có giao dịch kho nào."
        />
    );
};

export default InventoryTransactionTable;
