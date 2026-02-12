import userApi from '../api';
import { User } from '../types/domain';
import { 
    AddressListResponse, 
    AdminChangePasswordReq, 
    AdminChangeRoleReq, 
    AdminChangeStatusReq, 
    AdminUpdateUserReq 
} from '../types/dto';

import { Pagination } from '../../../shared/types/pagination';

const userService = {
    async getList(
        page?: number,
        size?: number,
        search?: string,
        status?: string,
        role?: string
    ): Promise<{ users: User[]; pagination: Pagination }> {
        const res = await userApi.getList(page ?? 1, size ?? 10, search, status, role);
        const data = res.data;
        if (!data) throw new Error(res.message || 'Failed to get users');

        return {
            users: data.users || [],
            pagination: data.pagination || {
                page: page ?? 1,
                size: size ?? 10,
                totalPages: 1,
                totalElements: (data.users || []).length,
            },
        };
    },

    async getAdminList(
        page?: number,
        size?: number,
        search?: string,
        status?: string
    ): Promise<{ users: User[]; pagination: Pagination }> {
        const res = await userApi.getAdminList(page ?? 1, size ?? 10, search, status);
        const data = res.data;
        if (!data) throw new Error(res.message || 'Failed to get admin users');

        return {
            users: data.users || [],
            pagination: data.pagination || {
                page: page ?? 1,
                size: size ?? 10,
                totalPages: 1,
                totalElements: (data.users || []).length,
            },
        };
    },

    async getDetails(id: number | string): Promise<User> {
        const res = await userApi.getDetails(id);
        if (!res.data) {
            throw new Error(res.message || 'User not found');
        }
        return res.data;
    },

    async update(id: number | string, data: AdminUpdateUserReq): Promise<User> {
        const res = await userApi.update(id, data);
        if (!res.data) {
            throw new Error(res.message || 'Failed to update user');
        }
        return res.data;
    },

    async resetPassword(id: number | string, data: AdminChangePasswordReq): Promise<void> {
        const res = await userApi.resetPassword(id, data);
        if (!res.success) {
            throw new Error(res.message || 'Failed to reset password');
        }
    },

    async changeRole(id: number | string, data: AdminChangeRoleReq): Promise<User> {
        const res = await userApi.changeRole(id, data);
        if (!res.data) {
            throw new Error(res.message || 'Failed to change user role');
        }
        return res.data;
    },

    async changeStatus(id: number | string, data: AdminChangeStatusReq): Promise<User> {
        const res = await userApi.changeStatus(id, data);
        if (!res.data) {
            throw new Error(res.message || 'Failed to change user status');
        }
        return res.data;
    },

    async getAddresses(id: number | string, page?: number, size?: number): Promise<AddressListResponse> {
        const res = await userApi.getAddresses(id, page, size);
        if (!res.data) {
            throw new Error(res.message || 'Failed to get user addresses');
        }
        return res.data;
    },

    async getOrders(id: number | string, page?: number, size?: number): Promise<{ orders: any[]; pagination: Pagination }> {
        const res = await userApi.getOrders(id, page, size);
        if (!res.data) {
            throw new Error(res.message || 'Failed to get user orders');
        }
        return {
            orders: res.data.content || [],
            pagination: {
                page: (res.data.number || 0) + 1,
                size: res.data.size || 10,
                totalPages: res.data.totalPages || 1,
                totalElements: res.data.totalElements || 0,
            }
        };
    },
};

export default userService;
