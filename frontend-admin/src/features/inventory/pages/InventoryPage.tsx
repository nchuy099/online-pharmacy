import { InventoryHeader, InventoryTable } from '../components';
import { useInventoryList } from '../hooks/useInventory';
import { Pagination, SearchFilter } from '../../../shared/components/ui';

const InventoryPage = () => {
    const { inventories, isLoading, error, refresh, pagination, search, setSearch } = useInventoryList();

    const handlePageChange = (newPage: number) => {
        refresh(newPage, pagination.size, search);
    };

    return (
        <div className="space-y-6">
            <InventoryHeader />

            <SearchFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm sản phẩm trong kho..."
                onClear={() => setSearch('')}
                accentColor="indigo"
                className="border-indigo-50 focus-within:ring-indigo-100"
            />

            {error ? (
                <div className="text-red-600 p-8 text-center bg-red-50 rounded-xl border border-red-100">{error.message}</div>
            ) : (
                <>
                    <InventoryTable inventories={inventories} isLoading={isLoading} />
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

        </div>
    );
};

export default InventoryPage;
