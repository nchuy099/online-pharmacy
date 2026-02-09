import axios from '../../shared/services/axios';
import { ApiResponse } from '../../shared/types';
import { OrderPageResponse, OrderDetailsResponse } from './type/order.dto';

const orderApi = {
    async getList(page: number = 1, size: number = 10): Promise<ApiResponse<OrderPageResponse>> {
        try {
            const res = await axios.get('/admin/orders/list', {
                params: { page, size },
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
};

export default orderApi;
