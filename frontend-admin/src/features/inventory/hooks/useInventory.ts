import { useCallback, useEffect, useState } from 'react';
import inventoryService from '../services';
import { InventoryVariantRow } from '../types/domain';

import { Pagination } from '../../../shared/types/pagination';

export const useInventoryList = () => {
    const [inventories, setInventories] = useState<InventoryVariantRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [search, setSearch] = useState<string>('');
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0,
    });

    const refresh = useCallback(async (page: number = 1, size: number = 10, searchParam?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await inventoryService.getList(page, size, searchParam);
            setInventories(response.inventories);
            setPagination(response.pagination);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSetSearch = (val: string) => {
        setSearch(val);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    useEffect(() => {
        refresh(pagination.page, pagination.size, search);
    }, [refresh, search, pagination.page, pagination.size]);

    return { inventories, isLoading, error, refresh, setInventories, pagination, search, setSearch: handleSetSearch };
};


export default useInventoryList;
