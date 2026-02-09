import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import {
    InventoryPageResponseDto,
    TransactionPageResponseDto,
    ImportStockRequestDto
} from '../types/dto';

const inventoryApi = {
    async getList(page: number = 1, size: number = 10, search?: string): Promise<ApiResponse<InventoryPageResponseDto>> {
        try {
            const res = await axios.get('/admin/inventories/list', {
                params: { page, size, search },
            });
            return res.data;
        } catch (error) {
            console.log('Get inventories error: ', error);
            throw error;
        }
    },

    async getTransactions(variantId: string | undefined, page: number = 1, size: number = 10): Promise<ApiResponse<TransactionPageResponseDto>> {
        try {
            const res = await axios.get(`/admin/inventories/${variantId}/transactions/list`, {
                params: { page, size },
            });
            return res.data;
        } catch (error) {
            console.log('Get inventory transactions error: ', error);
            throw error;
        }
    },

    async importStock(variantId: string, payload: ImportStockRequestDto): Promise<ApiResponse<void>> {
        try {
            const res = await axios.post(`/admin/inventories/${variantId}/import`, payload);
            return res.data;
        } catch (error) {
            console.log('Import stock error: ', error);
            throw error;
        }
    },
};

export default inventoryApi;
