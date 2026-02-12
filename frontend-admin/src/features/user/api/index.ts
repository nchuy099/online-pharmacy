import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import { 
    AddressListResponse, 
    AdminCreateUserReq,
    AdminChangePasswordReq, 
    AdminChangeRoleReq, 
    AdminChangeStatusReq, 
    AdminUpdateUserReq, 
    UserListResponse 
} from '../types/dto';
import { User } from '../types/domain';

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 10;

const userApi = {
    async create(data: AdminCreateUserReq): Promise<ApiResponse<User>> {
        try {
            const res = await axios.post('/admin/users/create', data);
            return res.data;
        } catch (error) {
            console.log('Create user error: ', error);
            throw error;
        }
    },

    async getList(
        page: number = DEFAULT_PAGE,
        size: number = DEFAULT_SIZE,
        search?: string,
        status?: string,
        role?: string
    ): Promise<ApiResponse<UserListResponse>> {
        try {
            const res = await axios.get('/admin/users/list', {
                params: { page, size, search, status, role },
            });
            return res.data;
        } catch (error) {
            console.log('Get users error: ', error);
            throw error;
        }
    },

    async getAdminList(
        page: number = DEFAULT_PAGE,
        size: number = DEFAULT_SIZE,
        search?: string,
        status?: string
    ): Promise<ApiResponse<UserListResponse>> {
        try {
            const res = await axios.get('/admin/users/admins/list', {
                params: { page, size, search, status },
            });
            return res.data;
        } catch (error) {
            console.log('Get admin users error: ', error);
            throw error;
        }
    },

    async getDetails(id: number | string): Promise<ApiResponse<User>> {
        try {
            const res = await axios.get(`/admin/users/${id}/details`);
            return res.data;
        } catch (error) {
            console.log('Get user details error: ', error);
            throw error;
        }
    },

    async update(id: number | string, data: AdminUpdateUserReq): Promise<ApiResponse<User>> {
        try {
            const res = await axios.put(`/admin/users/${id}`, data);
            return res.data;
        } catch (error) {
            console.log('Update user error: ', error);
            throw error;
        }
    },

    async resetPassword(id: number | string, data: AdminChangePasswordReq): Promise<ApiResponse<void>> {
        try {
            const res = await axios.put(`/admin/users/${id}/password/reset`, data);
            return res.data;
        } catch (error) {
            console.log('Reset password error: ', error);
            throw error;
        }
    },

    async changeRole(id: number | string, data: AdminChangeRoleReq): Promise<ApiResponse<User>> {
        try {
            const res = await axios.put(`/admin/users/${id}/role`, data);
            return res.data;
        } catch (error) {
            console.log('Change role error: ', error);
            throw error;
        }
    },

    async changeStatus(id: number | string, data: AdminChangeStatusReq): Promise<ApiResponse<User>> {
        try {
            const res = await axios.put(`/admin/users/${id}/status`, data);
            return res.data;
        } catch (error) {
            console.log('Change status error: ', error);
            throw error;
        }
    },

    async getAddresses(id: number | string, page: number = 1, size: number = 10): Promise<ApiResponse<AddressListResponse>> {
        try {
            const res = await axios.get(`/admin/users/${id}/addresses`, {
                params: { page, size }
            });
            return res.data;
        } catch (error) {
            console.log('Get user addresses error: ', error);
            throw error;
        }
    },

    async getOrders(id: number | string, page: number = 1, size: number = 10): Promise<ApiResponse<any>> {
        try {
            const res = await axios.get(`/admin/users/${id}/orders`, {
                params: { page, size }
            });
            return res.data;
        } catch (error) {
            console.log('Get user orders error: ', error);
            throw error;
        }
    },
};

export default userApi;
