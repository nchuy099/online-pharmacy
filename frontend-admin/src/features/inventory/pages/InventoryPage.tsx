import { useMemo, useState } from 'react';
import { InventoryHeader, InventoryTable, ImportStockDialog } from '../components';
import { useInventoryActions, useInventoryList } from '../hooks';
import { InventorySummaryRow } from '../types/domain';
import { Pagination, SearchFilter } from '../../../shared/components/ui';

const InventoryPage = () => {
    const {
        inventories,
        isLoading,
        error,
        refresh,
        pagination,
        filters,
        setSearch,
        clearFilters,
    } = useInventoryList();
    const { importStock, isLoading: isImporting } = useInventoryActions();
    const [selectedInventory, setSelectedInventory] = useState<InventorySummaryRow | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const handlePageChange = (newPage: number) => {
        refresh(newPage, pagination.size, filters);
    };

    const inventoryByProduct = useMemo(() => {
        const seen = new Map<string, InventorySummaryRow>();
        inventories.forEach((inventory) => {
            if (!seen.has(inventory.variantId)) {
                seen.set(inventory.variantId, inventory);
            }
        });
        return Array.from(seen.values());
    }, [inventories]);

    const handleImportOpen = (inventory?: InventorySummaryRow) => {
        setSelectedInventory(inventory || inventoryByProduct[0] || null);
        setIsImportOpen(true);
    };

    const handleImportConfirm = async (
        variantId: string,
        lotNumber: string,
        expiryDate: string,
        quantity: number,
        unitCost: number,
        note?: string
    ) => {
        await importStock(variantId, lotNumber, expiryDate, quantity, unitCost, note);
        setIsImportOpen(false);
        refresh(pagination.page, pagination.size, filters);
    };

    return (
        <div className="space-y-6">
            <InventoryHeader />

            <SearchFilter
                search={filters.search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm sản phẩm, SKU trong kho..."
                onClear={clearFilters}
                accentColor="indigo"
                className="border-indigo-50 focus-within:ring-indigo-100"
            >
                <button
                    onClick={() => handleImportOpen()}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                    Nhập kho
                </button>
            </SearchFilter>

            {error ? (
                <div className="text-red-600 p-8 text-center bg-red-50 rounded-xl border border-red-100">{error.message}</div>
            ) : (
                <>
                    <InventoryTable inventories={inventories} isLoading={isLoading} onImport={handleImportOpen} />
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
                inventory={selectedInventory}
                variantOptions={inventoryByProduct}
                onClose={() => setIsImportOpen(false)}
                onConfirm={handleImportConfirm}
                isLoading={isImporting}
            />
        </div>
    );
};

export default InventoryPage;
