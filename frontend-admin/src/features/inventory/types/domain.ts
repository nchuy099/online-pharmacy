import { Pagination } from '../../../shared/types';

export interface InventoryVariantRow {
    id: string;
    variantId: string;
    productId: string;
    productName: string;
    productWebName: string;
    productCode?: string;
    productSlug: string;
    productSku: string;
    unitType?: string;
    specification?: string;
    quantityOnHand: number;
    quantityReserved: number;
    quantityAvailable: number;
    salePrice?: number;
    averageImportCost?: number;
}

export interface InventoryPageList {
    inventories: InventoryVariantRow[];
    pagination?: Pagination;
}

export interface InventoryTransaction {
    id: string;
    productName: string;
    variantId: string;
    variantSku?: string;
    unitType?: string;
    specification?: string;
    salePrice?: number;
    averageImportCost?: number;
    type: string;
    quantity: number;
    unitCost?: number;
    note?: string;
    createdAt?: string;
}

export interface InventorySummary {
    productId: string;
    productName: string;
    productWebName: string;
    productCode?: string;
    productSlug: string;
    variantId: string;
    variantSku?: string;
    unitType?: string;
    specification?: string;
    quantityOnHand: number;
    quantityReserved: number;
    quantityAvailable: number;
    salePrice?: number;
    averageImportCost?: number;
    inventories: InventoryVariantRow[];
    transactions: InventoryTransaction[];
    pagination?: Pagination;
}

export interface ImportStockPayload {
    quantity: number;
    unitCost: number;
    note?: string;
}
