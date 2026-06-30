import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/components';
import { Pagination, SearchFilter } from '../../../shared/components/ui';
import { InventoryEmptyState, InventoryTransactionTable } from '../components';
import { useInventoryTransactions } from '../hooks/useInventoryTransactions';

const InventoryTransactionsPage = () => {
    const { variantId } = useParams<{ variantId?: string }>();
    const [searchParams] = useSearchParams();
    const lotId = searchParams.get('lotId') || undefined;
    const {
        summary,
        transactions,
        isLoading,
        error,
        refresh,
        pagination,
        filters,
        setSearch,
        setType,
        clearFilters,
    } = useInventoryTransactions(variantId);

    const visibleTransactions = useMemo(() => {
        const base = lotId ? transactions.filter((transaction) => transaction.lotId === lotId) : transactions;
        const search = filters.search.trim().toLowerCase();

        return base.filter((transaction) => {
            if (filters.type !== 'all' && transaction.type !== filters.type) {
                return false;
            }
            if (!search) {
                return true;
            }

            return [
                transaction.productName,
                transaction.variantSku,
                transaction.lotNumber,
                transaction.note,
            ]
                .filter(Boolean)
                .some((value) => value?.toLowerCase().includes(search));
        });
    }, [filters.search, filters.type, lotId, transactions]);

    const handlePageChange = (newPage: number) => {
        refresh(newPage, pagination.size);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Lịch sử kho"
                description={summary
                    ? `Audit inventory cho ${summary.productWebName || summary.productName} - ${summary.specification || summary.unitType || 'Mặc định'}`
                    : 'Theo dõi nguyên nhân thay đổi tồn kho, lot nào đã reserve/export và ai thao tác.'}
            />

            <SearchFilter
                search={filters.search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm theo sản phẩm, SKU, số lô, mã đơn..."
                onClear={clearFilters}
                accentColor="indigo"
                filters={[
                    {
                        key: 'type',
                        label: 'Loại giao dịch',
                        value: filters.type,
                        onChange: setType,
                        options: [
                            { label: 'IMPORT', value: 'IMPORT' },
                            { label: 'RESERVE', value: 'RESERVE' },
                            { label: 'RELEASE', value: 'RELEASE' },
                            { label: 'EXPORT', value: 'EXPORT' },
                            { label: 'ADJUST', value: 'ADJUST' },
                            { label: 'EXPIRE', value: 'EXPIRE' },
                        ],
                    },
                ]}
            />

            {error ? (
                <div className="text-red-600 p-8 text-center bg-red-50 rounded-xl border border-red-100">{error.message}</div>
            ) : visibleTransactions.length === 0 && !isLoading ? (
                <InventoryEmptyState
                    title="Chưa có giao dịch kho"
                    description="Biến thể này chưa có giao dịch kho phù hợp với bộ lọc hiện tại."
                    ctaLabel="Về lô hàng"
                    ctaTo={variantId ? `/inventories/${variantId}/lots` : '/inventories/summary'}
                />
            ) : (
                <>
                    <InventoryTransactionTable transactions={visibleTransactions} isLoading={isLoading} />
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalElements={pagination.totalElements}
                        pageSize={pagination.size}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
};

export default InventoryTransactionsPage;
