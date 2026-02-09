import { useCallback, useEffect, useState } from 'react';
import orderService from '../services';
import { Order } from '../types/domain';

import { Pagination } from '../../../shared/types/pagination';

export const useOrderList = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [search, setSearch] = useState<string>('');
    const [status, setStatus] = useState<string>('all');
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0,
    });

    const refresh = useCallback(async (page: number = 1, size: number = 10, searchParam?: string, statusParam?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await orderService.getList(
                page,
                size,
                searchParam,
                statusParam === 'all' ? undefined : statusParam
            );
            setOrders(response.orders);
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

    const handleSetStatus = (val: string) => {
        setStatus(val);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    useEffect(() => {
        refresh(pagination.page, pagination.size, search, status);
    }, [refresh, search, status, pagination.page, pagination.size]);

    return {
        orders,
        isLoading,
        error,
        refresh,
        setOrders,
        pagination,
        search,
        setSearch: handleSetSearch,
        status,
        setStatus: handleSetStatus
    };
};


export default useOrderList;
