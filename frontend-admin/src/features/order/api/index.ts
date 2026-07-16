import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import { OrderPageResponse, OrderDetailsResponse } from '../types/dto';

const orderApi = {
    async getList(page: number = 1, size: number = 10, search?: string, status?: string): Promise<ApiResponse<OrderPageResponse>> {
        try {
            const res = await axios.get('/admin/orders/list', {
                params: { page, size, search, status },
            });
            return res.data;
        } catch (error) {
            console.log('Get orders error: ', error);
            throw error;
        }
    },

    async getDetails(id: string): Promise<ApiResponse<OrderDetailsResponse>> {
        try {
            const res = await axios.get(`/admin/orders/${id}/details`);
            return res.data;
        } catch (error) {
            console.log('Get order details error: ', error);
            throw error;
        }
    },

    async confirmOrder(id: string): Promise<ApiResponse<OrderDetailsResponse>> {
        try {
            const res = await axios.post(`/admin/orders/${id}/confirm`);
            return res.data;
        } catch (error) {
            console.error('Confirm order error: ', error);
            throw error;
        }
    },

    async shipOrder(id: string): Promise<ApiResponse<OrderDetailsResponse>> {
        try {
            const res = await axios.post(`/admin/orders/${id}/ship`);
            return res.data;
        } catch (error) {
            console.error('Ship order error: ', error);
            throw error;
        }
    },

    async approveReturnRequest(id: string, reviewNote?: string): Promise<ApiResponse<OrderDetailsResponse>> {
        try {
            const res = await axios.post(`/admin/orders/${id}/return-requests/approve`, { reviewNote });
            return res.data;
        } catch (error) {
            console.error('Approve return request error: ', error);
            throw error;
        }
    },

    async rejectReturnRequest(id: string, reviewNote?: string): Promise<ApiResponse<OrderDetailsResponse>> {
        try {
            const res = await axios.post(`/admin/orders/${id}/return-requests/reject`, { reviewNote });
            return res.data;
        } catch (error) {
            console.error('Reject return request error: ', error);
            throw error;
        }
    },
};

export default orderApi;
