import { useCallback, useEffect, useState } from 'react';
import inventoryService from '../services';
import { InventorySummaryFiltersState, InventorySummaryRow } from '../types/domain';
import { Pagination } from '../../../shared/types/pagination';

const DEFAULT_PAGINATION: Pagination = {
    page: 1,
    size: 10,
    totalPages: 0,
    totalElements: 0,
};

const DEFAULT_FILTERS: InventorySummaryFiltersState = {
    search: '',
};

export const useInventoryList = () => {
    const [inventories, setInventories] = useState<InventorySummaryRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [filters, setFilters] = useState<InventorySummaryFiltersState>(DEFAULT_FILTERS);
    const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);

    const refresh = useCallback(async (page: number = 1, size: number = 10, nextFilters: InventorySummaryFiltersState = filters) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await inventoryService.getSummaryList(page, size, {
                search: nextFilters.search || undefined,
            });
            setInventories(response.inventories);
            setPagination(response.pagination ?? DEFAULT_PAGINATION);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        refresh(pagination.page, pagination.size, filters);
    }, [refresh, pagination.page, pagination.size, filters]);

    const updateFilter = <K extends keyof InventorySummaryFiltersState>(key: K, value: InventorySummaryFiltersState[K]) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setFilters(DEFAULT_FILTERS);
    };

    return {
        inventories,
        isLoading,
        error,
        refresh,
        setInventories,
        pagination,
        filters,
        setSearch: (value: string) => updateFilter('search', value),
        clearFilters,
    };
};

export default useInventoryList;
