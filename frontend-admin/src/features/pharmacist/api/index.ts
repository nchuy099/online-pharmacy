import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import { CreatePharmacistParams, PharmacistPageResponse, PharmacistResponse, UpdatePharmacistParams } from '../types/dto';

const pharmacistApi = {
    async getList(
        page: number = 1,
        size: number = 10,
        search?: string,
        specialty?: string,
        status?: string
    ): Promise<ApiResponse<PharmacistPageResponse>> {
        const res = await axios.get('/admin/users/list', {
            params: {
                page,
                size,
                search,
                specialty,
                status,
                role: 'PHARMACIST',
            }
        });
        return res.data;
    },

    async create(payload: CreatePharmacistParams): Promise<ApiResponse<PharmacistResponse>> {
        const res = await axios.post('/admin/users', {
            ...payload,
            roleName: 'PHARMACIST',
        });
        return res.data;
    },

    async getDetails(id: string): Promise<ApiResponse<PharmacistResponse>> {
        const res = await axios.get(`/admin/users/${id}/details`);
        return res.data;
    },

    async update(id: string, payload: UpdatePharmacistParams): Promise<ApiResponse<PharmacistResponse>> {
        const res = await axios.put(`/admin/users/${id}/pharmacist-profile`, payload);
        return res.data;
    },

    async remove(id: string): Promise<ApiResponse> {
        const res = await axios.put(`/admin/users/${id}/status`, { status: 'DELETED' });
        return res.data;
    },
};

export default pharmacistApi;
