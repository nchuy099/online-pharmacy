import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components';
import { Pagination, SearchFilter } from '../../../shared/components/ui';
import { ImportStockDialog, InventoryEmptyState, InventoryLotTable } from '../components';
import { useInventoryActions } from '../hooks/useInventoryActions';
import { useInventoryLots } from '../hooks/useInventoryTransactions';

const InventoryTransactionPage = () => {
    const { variantId, id } = useParams<{ variantId?: string; id?: string }>();
    const resolvedVariantId = variantId || id;
    const navigate = useNavigate();
    const { summary, lots, isLoading, error, refresh, pagination, filters, setSearch, setStatus, clearFilters } = useInventoryLots(resolvedVariantId);
    const { importStock, isLoading: isImporting } = useInventoryActions();
    const [isImportOpen, setIsImportOpen] = useState(false);

    const handlePageChange = (newPage: number) => {
        refresh(newPage, pagination.size, filters);
    };

    const handleImportConfirm = async (
        selectedVariantId: string,
        lotNumber: string,
        expiryDate: string,
        quantity: number,
        unitCost: number,
        note?: string
    ) => {
        await importStock(selectedVariantId, lotNumber, expiryDate, quantity, unitCost, note);
        setIsImportOpen(false);
        refresh(pagination.page, pagination.size, filters);
    };

    if (error) {
        return <div className="text-red-600 p-8 text-center bg-red-50 rounded-xl border border-red-100">{error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={summary ? (summary.productWebName || summary.productName) : 'Lô hàng'}
                description="Xem tồn kho theo lô của biến thể đã chọn, sắp xếp FEFO và theo dõi lượng đang giữ."
                actionLabel="Nhập kho"
                onAction={() => setIsImportOpen(true)}
                onBack={() => navigate('/inventories/summary')}
            />

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SummaryCard label="Biến thể" value={summary.specification || summary.unitType || 'Mặc định'} helper={`SKU: ${summary.productSku || '-'}`} />
                    <SummaryCard label="Tổng tồn" value={summary.quantityOnHand.toLocaleString('vi-VN')} />
                    <SummaryCard label="Đang giữ" value={summary.quantityReserved.toLocaleString('vi-VN')} />
                    <SummaryCard label="Có thể bán" value={summary.quantityAvailable.toLocaleString('vi-VN')} valueClassName="text-emerald-600" />
                </div>
            )}

            <SearchFilter
                search={filters.search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm số lô hoặc SKU..."
                onClear={clearFilters}
                accentColor="emerald"
                filters={[
                    {
                        key: 'status',
                        label: 'Trạng thái lô',
                        value: filters.status,
                        onChange: setStatus,
                        options: [
                            { label: 'Đang bán', value: 'ACTIVE' },
                            { label: 'Sắp hết hạn', value: 'EXPIRING' },
                            { label: 'Hết hạn', value: 'EXPIRED' },
                            { label: 'Đã chặn', value: 'BLOCKED' },
                            { label: 'Hết tồn', value: 'DEPLETED' },
                        ],
                    },
                ]}
            />

            {!resolvedVariantId && lots.length === 0 && !isLoading ? (
                <InventoryEmptyState
                    title="Chưa chọn biến thể"
                    description="Màn này hiển thị lô hàng theo từng product variant. Hãy vào Tổng tồn kho và chọn `Xem lô` từ biến thể cần quản lý."
                    ctaLabel="Về tổng tồn kho"
                    ctaTo="/inventories/summary"
                />
            ) : (
                <>
                    <InventoryLotTable
                        lots={lots}
                        isLoading={isLoading}
                        onViewTransactions={(lot) => navigate(`/inventories/${lot.variantId}/transactions?lotId=${lot.id}`)}
                    />
                    {!isLoading && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            totalElements={pagination.totalElements}
                            pageSize={pagination.size}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}

            <ImportStockDialog
                isOpen={isImportOpen}
                inventory={summary ?? null}
                onClose={() => setIsImportOpen(false)}
                onConfirm={handleImportConfirm}
                isLoading={isImporting}
            />
        </div>
    );
};

const SummaryCard = ({
    label,
    value,
    helper,
    valueClassName = 'text-slate-900',
}: {
    label: string;
    value: string;
    helper?: string;
    valueClassName?: string;
}) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className={`text-xl font-bold ${valueClassName}`}>{value}</p>
        {helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
    </div>
);

export default InventoryTransactionPage;
