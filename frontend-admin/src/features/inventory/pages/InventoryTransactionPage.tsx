import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components';
import { useInventoryTransactions } from '../hooks/useInventoryTransactions';
import { useInventoryActions } from '../hooks/useInventoryActions';
import InventoryTransactionTable from '../components/InventoryTransactionTable';
import { ImportStockDialog } from '../components';
import { Pagination } from '../../../shared/components/ui';

const InventoryTransactionPage = () => {
    const { id: variantId } = useParams<{ id: string }>();
    const { data, transactions, isLoading, refresh, pagination } = useInventoryTransactions(variantId);
    const { importStock, isLoading: isImporting } = useInventoryActions();
    const [isImportOpen, setIsImportOpen] = useState(false);
    const formatMoney = (value?: number | null) => (value != null ? `${value.toLocaleString('vi-VN')} đ` : 'N/A');

    const handlePageChange = (newPage: number) => {
        refresh(newPage, pagination.size);
    };

    const handleImportConfirm = async (variantId: string, quantity: number, unitCost: number, note?: string) => {
        if (variantId == null || variantId === '') return;
        try {
            await importStock(variantId, quantity, unitCost, note);
            setIsImportOpen(false);
            refresh(pagination.page, pagination.size);
        } catch (err) {
            console.error('Import failed:', err);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-normal">Lịch sử giao dịch biến thể:</span>
                            <span className="font-bold text-gray-900">{data?.productWebName || data?.productName || '...'}</span>
                        </div>
                        {data && (
                            <div className="flex flex-wrap items-center gap-2 group">
                                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                    {data.specification || data.unitType || 'Biến thể'}
                                </span>
                                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 italic transition-colors group-hover:text-slate-600 group-hover:bg-white truncate max-w-[300px]" title={data.variantSku || '-'}>
                                    {data.variantSku || '-'}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(data.variantSku || '');
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Copy mã biến thể"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                }
                description="Lưu lại toàn bộ lịch sử nhập, xuất và giữ hàng của biến thể đang chọn"
                actionLabel="Nhập kho"
                onAction={() => setIsImportOpen(true)}
                onBack={() => window.history.back()}
            />

            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Tổng tồn kho</p>
                        <p className="text-2xl font-bold text-gray-900">{data.quantityOnHand}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Có sẵn</p>
                        <p className="text-2xl font-bold text-emerald-600">{data.quantityAvailable}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Đang giữ</p>
                        <p className="text-2xl font-bold text-orange-600">{data.quantityReserved}</p>
                    </div>
                </div>
            )}

            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Giá bán hiện tại</p>
                        <p className="text-2xl font-bold text-blue-700">{formatMoney(data.salePrice)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Giá nhập trung bình</p>
                        <p className="text-2xl font-bold text-emerald-700">{formatMoney(data.averageImportCost)}</p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <InventoryTransactionTable transactions={transactions} isLoading={isLoading} />
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalElements={pagination.totalElements}
                    pageSize={pagination.size}
                    onPageChange={handlePageChange}
                />
            </div>

            <ImportStockDialog
                isOpen={isImportOpen}
                inventory={data}
                onClose={() => setIsImportOpen(false)}
                onConfirm={handleImportConfirm}
                isLoading={isImporting}
            />
        </div>
    );
};

export default InventoryTransactionPage;
