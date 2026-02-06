import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import { Category } from '../types/domain';

const categoryApi = {
    async getList(page: number = 1, size: number = 10, search?: string, level?: number, isActive?: boolean): Promise<ApiResponse> {
        try {
            const res = await axios.get('/admin/categories/list', { params: { page, size, search, level, isActive } });
            return res.data;
        } catch (error) {
            console.log('Get categories error: ', error);
            throw error;
        }
    },

    async getAll(): Promise<ApiResponse> {
        try {
            const res = await axios.get('/admin/categories/all');
            return res.data;
        } catch (error) {
            console.log('Get all categories error: ', error);
            throw error;
        }
    },

    async create(payload: Omit<Category, 'id'>): Promise<ApiResponse> {
        try {
            const res = await axios.post('/admin/categories/create', payload);
            return res.data;
        } catch (error) {
            console.log('Create category error: ', error);
            throw error;
        }
    },

    async update(id: string | number | undefined, payload: Omit<Category, 'id'>): Promise<ApiResponse> {
        try {
            const res = await axios.put(`/admin/categories/${id}/update`, payload);
            return res.data;
        } catch (error) {
            console.log('Update category error: ', error);
            throw error;
        }
    },

    async remove(categoryId: string | undefined): Promise<ApiResponse> {
        try {
            const res = await axios.delete(`/admin/categories/${categoryId}/delete`);
            return res.data;
        } catch (error) {
            console.log('Delete category error: ', error);
            throw error;
        }
    },
};

export default categoryApi;
