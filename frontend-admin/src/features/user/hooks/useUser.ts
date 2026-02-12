import { useCallback, useEffect, useState } from 'react';
import userService from '../services';
import { User } from '../types/domain';

import { Pagination } from '../../../shared/types/pagination';

export const useUserList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [search, setSearch] = useState<string>('');
    const [status, setStatus] = useState<string>('all');
    const [role, setRole] = useState<string>('all');
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0,
    });

    const refresh = useCallback(
        async (
            page: number = 1,
            size: number = 10,
            searchParam?: string,
            statusParam?: string,
            roleParam?: string
        ) => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await userService.getList(
                    page,
                    size,
                    searchParam,
                    statusParam === 'all' ? undefined : statusParam,
                    roleParam === 'all' ? undefined : roleParam
                );
                setUsers(response.users || []);
                setPagination(response.pagination);
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        refresh(pagination.page, pagination.size, search, status, role);
    }, [refresh, search, status, role, pagination.page, pagination.size]);

    return {
        users,
        isLoading,
        error,
        refresh,
        pagination,
        search,
        setSearch,
        status,
        setStatus,
        role,
        setRole,
    };
};

export const useUserDetails = (id?: number | string) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchDetails = useCallback(async () => {
        if (id === undefined || id === null || id === '') return;
        setIsLoading(true);
        setError(null);
        try {
            const detail = await userService.getDetails(id);
            setUser(detail);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    return { user, isLoading, error, refresh: fetchDetails };
};
