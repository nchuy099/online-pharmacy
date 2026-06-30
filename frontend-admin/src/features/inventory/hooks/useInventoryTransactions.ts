import { useCallback, useEffect, useState } from 'react';
import inventoryService from '../services';
import {
    InventoryLotFiltersState,
    InventoryLotRow,
    InventorySummaryRow,
    InventoryTransaction,
    InventoryTransactionFiltersState,
} from '../types/domain';
import { Pagination } from '../../../shared/types/pagination';

const DEFAULT_PAGINATION: Pagination = {
    page: 1,
    size: 10,
    totalPages: 0,
    totalElements: 0,
};

export const useInventoryLots = (variantId?: string) => {
    const [summary, setSummary] = useState<InventorySummaryRow | null>(null);
    const [lots, setLots] = useState<InventoryLotRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
    const [filters, setFilters] = useState<InventoryLotFiltersState>({ search: '', status: 'all' });

    const refresh = useCallback(async (page: number = 1, size: number = 10, nextFilters: InventoryLotFiltersState = filters) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = variantId
                ? await inventoryService.getVariantLots(variantId, page, size, {
                    search: nextFilters.search || undefined,
                    status: nextFilters.status !== 'all' && nextFilters.status !== 'EXPIRING'
                        ? nextFilters.status
                        : undefined,
                })
                : { summary: null, lots: [], pagination: DEFAULT_PAGINATION };
            setSummary(response.summary);
            setLots(
                nextFilters.status === 'EXPIRING'
                    ? response.lots.filter((lot) => lot.status === 'EXPIRING')
                    : response.lots
            );
            setPagination(response.pagination ?? DEFAULT_PAGINATION);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [filters, variantId]);

    useEffect(() => {
        refresh(pagination.page, pagination.size);
    }, [refresh, pagination.page, pagination.size, filters]);

    const updateFilter = <K extends keyof InventoryLotFiltersState>(key: K, value: InventoryLotFiltersState[K]) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return {
        summary,
        lots,
        isLoading,
        error,
        pagination,
        filters,
        refresh,
        setSearch: (value: string) => updateFilter('search', value),
        setStatus: (value: string) => updateFilter('status', value),
        clearFilters: () => {
            setPagination((prev) => ({ ...prev, page: 1 }));
            setFilters({ search: '', status: 'all' });
        },
    };
};

export const useInventoryTransactions = (variantId?: string) => {
    const [summary, setSummary] = useState<InventorySummaryRow | null>(null);
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
    const [filters, setFilters] = useState<InventoryTransactionFiltersState>({
        search: '',
        type: 'all',
    });

    const refresh = useCallback(async (page: number = 1, size: number = 10) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = variantId
                ? await inventoryService.getVariantTransactions(variantId, page, size)
                : { summary: null, transactions: [], pagination: DEFAULT_PAGINATION };
            setSummary(response.summary ?? null);
            setTransactions(response.transactions);
            setPagination(response.pagination ?? DEFAULT_PAGINATION);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [filters, variantId]);

    useEffect(() => {
        refresh(pagination.page, pagination.size);
    }, [refresh, pagination.page, pagination.size, filters]);

    const updateFilter = <K extends keyof InventoryTransactionFiltersState>(key: K, value: InventoryTransactionFiltersState[K]) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return {
        summary,
        transactions,
        isLoading,
        error,
        refresh,
        pagination,
        filters,
        setSearch: (value: string) => updateFilter('search', value),
        setType: (value: string) => updateFilter('type', value),
        clearFilters: () => {
            setPagination((prev) => ({ ...prev, page: 1 }));
            setFilters({ search: '', type: 'all' });
        },
    };
};
