import { useCallback, useEffect, useState } from 'react';
import categoryService from '../services';
import { Category } from '../types/domain';

import { Pagination } from '../../../shared/types/pagination';

export const useCategoryList = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [search, setSearch] = useState<string>('');
    const [level, setLevel] = useState<number | undefined>(undefined);
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0,
    });

    const refresh = useCallback(async (page: number = 1, size: number = 10, searchParam?: string, levelParam?: number, isActiveParam?: boolean) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await categoryService.getList(page, size, searchParam, levelParam, isActiveParam);
            setCategories(response.categories);
            setPagination(response.pagination);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setPage = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);

    useEffect(() => {
        refresh(pagination.page, pagination.size, search, level, isActive);
    }, [refresh, search, level, isActive, pagination.page, pagination.size]);

    return { categories, isLoading, error, refresh, setCategories, pagination, search, setSearch, level, setLevel, isActive, setIsActive, setPage };
};

export const useCategoryAll = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return { categories, isLoading, error, fetchAll };
};

export const useCategoryActions = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const createCategory = useCallback(async (payload: Omit<Category, 'id'>) => {
        setIsLoading(true);
        setError(null);
        try {
            return await categoryService.create(payload);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateCategory = useCallback(async (payload: Category) => {
        setIsLoading(true);
        setError(null);
        try {
            return await categoryService.update(payload);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const removeCategory = useCallback(async (categoryId: string | undefined) => {
        setIsLoading(true);
        setError(null);
        try {
            await categoryService.remove(categoryId);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { createCategory, updateCategory, removeCategory, isLoading, error };
};
