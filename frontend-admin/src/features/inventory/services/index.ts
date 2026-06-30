import inventoryApi from '../api';
import {
    InventoryLotsPageData,
    InventorySummaryRow,
    InventoryTransaction,
    InventoryTransactionsPageData,
} from '../types/domain';
import {
    ImportStockResponseDto,
    InventoryLotResponseDto,
    InventoryLotsResponseDto,
    InventoryResponseDto,
    TransactionPageResponseDto,
    TransactionResponseDto,
} from '../types/dto';
import { Pagination } from '../../../shared/types/pagination';

const DEFAULT_PAGINATION: Pagination = {
    page: 1,
    size: 10,
    totalPages: 0,
    totalElements: 0,
};

const unwrapData = <T>(response: any): T => response?.data ?? response?.result ?? response;

const toNumber = (value?: number | null) => value ?? 0;

const normalizeStockStatus = (available: number) => available <= 0 ? 'OUT_OF_STOCK' : 'IN_STOCK';

const parseLotStatus = (status?: string, expiryDate?: string) => {
    if (status === 'ACTIVE' && expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 30) {
            return 'EXPIRING' as const;
        }
    }
    return (status || 'ACTIVE') as 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'BLOCKED' | 'DEPLETED';
};

const mapApiInventory = (item: InventoryResponseDto): InventorySummaryRow => {
    const quantityOnHand = toNumber(item.quantityOnHand ?? item.quantity_on_hand);
    const quantityReserved = toNumber(item.quantityReserved ?? item.quantity_reserved);
    const quantityAvailable = item.quantityAvailable ?? item.quantity_available ?? quantityOnHand - quantityReserved;

    return {
        id: item.id || item.variantId || item.variant_id || '',
        variantId: item.variantId || item.variant_id || '',
        productId: item.productId || item.product_id || '',
        productName: item.productName || item.product_name || '',
        productWebName: item.productWebName || item.product_web_name || item.productName || item.product_name || '',
        productCode: item.productCode || item.product_code,
        productSlug: item.productSlug || item.product_slug,
        productSku: item.productSku || item.product_sku || '',
        unitType: item.unitType || item.unit_type,
        specification: item.specification,
        quantityOnHand,
        quantityReserved,
        quantityAvailable,
        salePrice: item.salePrice ?? item.sale_price,
        averageImportCost: item.averageImportCost ?? item.average_import_cost,
        stockStatus: normalizeStockStatus(quantityAvailable),
    };
};

const mapApiLot = (item: InventoryLotResponseDto) => {
    const quantityOnHand = toNumber(item.quantityOnHand ?? item.quantity_on_hand);
    const quantityReserved = toNumber(item.quantityReserved ?? item.quantity_reserved);
    const quantityAvailable = item.quantityAvailable ?? item.quantity_available ?? quantityOnHand - quantityReserved;
    const expiryDate = item.expiryDate ?? item.expiry_date ?? '';

    let daysLeft: number | undefined;
    if (expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
        id: item.id || '',
        variantId: item.variantId || item.variant_id || '',
        productId: item.productId || item.product_id,
        productName: item.productName || item.product_name,
        productWebName: item.productWebName || item.product_web_name,
        productCode: item.productCode || item.product_code,
        productSlug: item.productSlug || item.product_slug,
        productSku: item.productSku || item.product_sku,
        unitType: item.unitType || item.unit_type,
        specification: item.specification,
        lotNumber: item.lotNumber || item.lot_number || '',
        expiryDate,
        receivedAt: item.receivedAt || item.received_at,
        quantityOnHand,
        quantityReserved,
        quantityAvailable,
        status: parseLotStatus(item.status, expiryDate),
        unitCost: item.unitCost ?? item.unit_cost,
        daysLeft,
    };
};

const mapApiInventoryTransaction = (item: TransactionResponseDto): InventoryTransaction => ({
    id: item.id,
    productName: item.productName || item.product_name,
    variantId: item.variantId || item.variant_id,
    variantSku: item.variantSku || item.variant_sku,
    unitType: item.unitType || item.unit_type,
    specification: item.specification,
    salePrice: item.salePrice ?? item.sale_price,
    averageImportCost: item.averageImportCost ?? item.average_import_cost,
    lotId: item.lotId || item.lot_id,
    lotNumber: item.lotNumber || item.lot_number,
    type: item.type,
    quantity: item.quantity,
    note: item.note,
    createdAt: item.createdAt || item.created_at,
    unitCost: item.unitCost ?? item.unit_cost,
});

const extractPagination = (data: any): Pagination => data?.pagination ?? DEFAULT_PAGINATION;

const mapLegacyTransactionSummary = (data: TransactionPageResponseDto): InventorySummaryRow => {
    if (data.summary) {
        return mapApiInventory(data.summary);
    }

    return mapApiInventory({
        id: data.variantId,
        variantId: data.variantId,
        productId: data.productId,
        productName: data.productName,
        productWebName: data.productWebName,
        productCode: data.productCode,
        productSlug: data.productSlug,
        productSku: data.variantSku,
        unitType: data.unitType,
        specification: data.specification,
        quantityOnHand: data.quantityOnHand,
        quantityReserved: data.quantityReserved,
        quantityAvailable: data.quantityAvailable,
        salePrice: data.salePrice,
        averageImportCost: data.averageImportCost,
    });
};

const inventoryService = {
    async getSummaryList(page?: number, size?: number, params?: Record<string, string | number | undefined>) {
        const res = await inventoryApi.getList(page ?? 1, size ?? 10, params);
        const data = unwrapData<{ inventories?: InventoryResponseDto[]; items?: InventoryResponseDto[]; pagination?: Pagination }>(res);
        const inventories = data?.inventories ?? data?.items ?? [];

        return {
            inventories: Array.isArray(inventories) ? inventories.map(mapApiInventory) : [],
            pagination: extractPagination(data),
        };
    },

    async getVariantLots(variantId: string, page?: number, size?: number, params?: Record<string, string | number | undefined>): Promise<InventoryLotsPageData> {
        const res = await inventoryApi.getVariantLots(variantId, page ?? 1, size ?? 10, params);
        const data = unwrapData<InventoryLotsResponseDto>(res);
        return {
            summary: data?.summary ? mapApiInventory(data.summary) : null,
            lots: (data?.lots ?? data?.items ?? []).map(mapApiLot),
            pagination: extractPagination(data),
        };
    },

    async getVariantTransactions(variantId: string, page?: number, size?: number): Promise<InventoryTransactionsPageData> {
        const res = await inventoryApi.getVariantTransactions(variantId, page ?? 1, size ?? 10);
        const data = unwrapData<TransactionPageResponseDto>(res);
        return {
            summary: mapLegacyTransactionSummary(data),
            transactions: (data?.transactions ?? []).map(mapApiInventoryTransaction),
            pagination: extractPagination(data),
        };
    },

    async importStock(
        variantId: string,
        lotNumber: string,
        expiryDate: string,
        quantity: number,
        unitCost: number,
        note?: string
    ): Promise<{ summary?: InventorySummaryRow; lot?: ReturnType<typeof mapApiLot> }> {
        const res = await inventoryApi.importStock(variantId, { lotNumber, expiryDate, quantity, unitCost, note });
        const data = unwrapData<ImportStockResponseDto>(res);
        return {
            summary: data?.summary ? mapApiInventory(data.summary) : undefined,
            lot: data?.lot ? mapApiLot(data.lot) : undefined,
        };
    },
};

export default inventoryService;
