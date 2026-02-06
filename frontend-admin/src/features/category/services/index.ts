import categoryApi from '../api';
import { Category } from '../types/domain';
import { Pagination } from '../../../shared/types/pagination';

const categoryService = {
    async getList(page?: number, size?: number, search?: string, level?: number, isActive?: boolean): Promise<{ categories: Category[]; pagination: Pagination }> {
        const res = await categoryApi.getList(page ?? 1, size ?? 10, search, level, isActive);
        const data = (res as any).data || res;
        const categories = (data as any).categories || [];
        const pagination = (data as any).pagination || {
            page: 1,
            size: 10,
            totalPages: 1,
            totalElements: categories.length,
        };
        return {
            categories: Array.isArray(categories) ? categories : [],
            pagination,
        };
    },

    async getAll(): Promise<Category[]> {
        const res = await categoryApi.getAll();
        const data = (res as any).data || res;
        const categories = Array.isArray(data) ? data : ((data as any).categories || data);
        return Array.isArray(categories) ? categories : [];
    },

    async create(payload: Omit<Category, 'id'>): Promise<Category> {
        const res = await categoryApi.create(payload);
        const category = (res as any).data || (res as any).result || res;
        if (!category) throw new Error((res as any).message || 'Create category failed');
        return category;
    },

    async update(payload: Category): Promise<Category> {
        if (!payload.id) throw new Error('Category ID is required for update');
        const res = await categoryApi.update(payload.id, {
            name: payload.name,
            parentId: payload.parentId,
            level: payload.level,
            isActive: payload.isActive
        });
        const category = (res as any).data || (res as any).result || res;
        if (!category) throw new Error((res as any).message || 'Update category failed');
        return category;
    },

    async remove(categoryId: string | undefined): Promise<void> {
        await categoryApi.remove(categoryId);
    },
};

export default categoryService;
