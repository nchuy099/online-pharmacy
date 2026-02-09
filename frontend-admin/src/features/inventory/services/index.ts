import inventoryApi from '../api';
import { InventoryVariantRow, InventoryTransaction, InventorySummary } from '../types/domain';
import { InventoryResponseDto, TransactionResponseDto } from '../types/dto';
import { Pagination } from '../../../shared/types/pagination';

const mapApiInventory = (item: InventoryResponseDto): InventoryVariantRow => ({
    id: item.id,
    variantId: item.variantId,
    productId: item.productId,
    productName: item.productName,
    productWebName: item.productWebName,
    productCode: item.productCode,
    productSlug: item.productSlug,
    productSku: item.productSku,
    unitType: item.unitType,
    specification: item.specification,
    quantityOnHand: item.quantityOnHand,
    quantityAvailable: item.quantityAvailable,
    quantityReserved: item.quantityReserved,
    salePrice: item.salePrice,
    averageImportCost: item.averageImportCost,
});

const mapApiInventoryTransaction = (item: TransactionResponseDto): InventoryTransaction => ({
    id: item.id,
    productName: item.productName,
    variantId: item.variantId,
    variantSku: item.variantSku,
    unitType: item.unitType,
    specification: item.specification,
    salePrice: item.salePrice,
    averageImportCost: item.averageImportCost,
    type: item.type,
    quantity: item.quantity,
    note: item.note,
    createdAt: item.createdAt,
    unitCost: item.unitCost,
});

const inventoryService = {
    async getList(page?: number, size?: number, search?: string): Promise<{ inventories: InventoryVariantRow[]; pagination: Pagination }> {
        const res = await inventoryApi.getList(page ?? 1, size ?? 10, search);
        const data = (res as any).data ?? res;
        const inventories = data.inventories ?? data.result?.inventories ?? [];
        const pagination = data.pagination ?? data.result?.pagination ?? {
            page: 1,
            size: 10,
            totalPages: 0,
            totalElements: 0,
        };
        return {
            inventories: Array.isArray(inventories) ? inventories.map(mapApiInventory) : [],
            pagination,
        };
    },

    async getTransactions(variantId: string, page?: number, size?: number): Promise<InventorySummary | null> {
        const res = await inventoryApi.getTransactions(variantId, page ?? 1, size ?? 10);
        const data = (res as any).data ?? res;

        if (!data) return null;

        return {
            productId: data.productId,
            productName: data.productName,
            productWebName: data.productWebName,
            productCode: data.productCode,
            productSlug: data.productSlug,
            variantId: data.variantId,
            variantSku: data.variantSku,
            unitType: data.unitType,
            specification: data.specification,
            quantityOnHand: data.quantityOnHand,
            quantityAvailable: data.quantityAvailable,
            quantityReserved: data.quantityReserved,
            inventories: (data.inventories || []).map(mapApiInventory),
            transactions: (data.transactions || []).map(mapApiInventoryTransaction),
            salePrice: data.salePrice,
            averageImportCost: data.averageImportCost,
            pagination: data.pagination
        };
    },

    async importStock(variantId: string, quantity: number, unitCost: number, note?: string): Promise<void> {
        await inventoryApi.importStock(variantId, { quantity, unitCost, note });
    },
};

export default inventoryService;
