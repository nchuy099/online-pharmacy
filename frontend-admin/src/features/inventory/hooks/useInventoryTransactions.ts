import { useCallback, useEffect, useState } from 'react';
import inventoryService from '../services';
import { InventorySummary } from '../types/domain';
import { Pagination } from '../../../shared/types/pagination';

export const useInventoryTransactions = (variantId?: string) => {
    const [data, setData] = useState<InventorySummary | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0,
    });

    const refresh = useCallback(async (page: number = 1, size: number = 10) => {
        if (!variantId) return;

        setIsLoading(true);
        setError(null);
        try {
            const result = await inventoryService.getTransactions(variantId, page, size);
            setData(result);
            if (result?.pagination) {
                setPagination(result.pagination);
            }
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [variantId]);

    useEffect(() => {
        refresh(pagination.page, pagination.size);
    }, [refresh]);

    return { data, transactions: data?.transactions || [], isLoading, error, refresh, pagination };
};
