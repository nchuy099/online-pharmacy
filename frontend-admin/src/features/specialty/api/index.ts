import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import { CreateSpecialtyParams, SpecialtyResponse } from '../types/dto';

const specialtyApi = {
    async getList(page: number = 1, size: number = 10, search?: string): Promise<ApiResponse<any>> {
        try {
            const res = await axios.get('/admin/catalogs/specialties/list', {
                params: { page, size, search }
            });
            return res.data;
        } catch (error) {
            console.error('Get specialties error: ', error);
            throw error;
        }
    },

    async create(payload: CreateSpecialtyParams): Promise<ApiResponse<SpecialtyResponse>> {
        try {
            const res = await axios.post('/admin/catalogs/specialties/create', payload);
            return res.data;
        } catch (error) {
            console.error('Create specialty error: ', error);
            throw error;
        }
    },

    async update(id: string, payload: CreateSpecialtyParams): Promise<ApiResponse<SpecialtyResponse>> {
        try {
            const res = await axios.put(`/admin/catalogs/specialties/${id}/update`, payload);
            return res.data;
        } catch (error) {
            console.error('Update specialty error: ', error);
            throw error;
        }
    },

    async remove(id: string): Promise<ApiResponse> {
        try {
            const res = await axios.delete(`/admin/catalogs/specialties/${id}/delete`);
            return res.data;
        } catch (error) {
            console.error('Delete specialty error: ', error);
            throw error;
        }
    },

    async getDetails(id: string): Promise<ApiResponse<SpecialtyResponse>> {
        try {
            const res = await axios.get(`/admin/catalogs/specialties/${id}/details`);
            return res.data;
        } catch (error) {
            console.error('Get specialty details error: ', error);
            throw error;
        }
    },
};

export default specialtyApi;
