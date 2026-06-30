import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import {
    ImportStockRequestDto,
    ImportStockResponseDto,
    InventoryPageResponseDto,
    InventoryLotsResponseDto,
    TransactionPageResponseDto,
} from '../types/dto';

const inventoryApi = {
    async getList(page: number = 1, size: number = 10, params?: Record<string, string | number | undefined>): Promise<ApiResponse<InventoryPageResponseDto>> {
        const res = await axios.get('/admin/inventories/list', {
            params: { page, size, ...params },
        });
        return res.data;
    },

    async getVariantTransactions(variantId: string, page: number = 1, size: number = 10): Promise<ApiResponse<TransactionPageResponseDto>> {
        const res = await axios.get(`/admin/inventories/${variantId}/transactions/list`, {
            params: { page, size },
        });
        return res.data;
    },

    async getVariantLots(
        variantId: string,
        page: number = 1,
        size: number = 10,
        params?: Record<string, string | number | undefined>
    ): Promise<ApiResponse<InventoryLotsResponseDto>> {
        const res = await axios.get(`/admin/inventories/${variantId}/lots`, {
            params: { page, size, ...params },
        });
        return res.data;
    },

    async importStock(variantId: string, payload: ImportStockRequestDto): Promise<ApiResponse<ImportStockResponseDto>> {
        const res = await axios.post(`/admin/inventories/${variantId}/import`, payload);
        return res.data;
    },
};

export default inventoryApi;
