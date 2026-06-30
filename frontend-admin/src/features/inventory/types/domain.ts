import { Pagination } from '../../../shared/types';

export type InventoryStockStatus = 'IN_STOCK' | 'OUT_OF_STOCK';
export type InventoryLotStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'BLOCKED' | 'DEPLETED';

export interface InventorySummaryRow {
    id: string;
    variantId: string;
    productId: string;
    productName: string;
    productWebName: string;
    productCode?: string;
    productSlug?: string;
    productSku: string;
    unitType?: string;
    specification?: string;
    quantityOnHand: number;
    quantityReserved: number;
    quantityAvailable: number;
    salePrice?: number;
    averageImportCost?: number;
    hasExpiredLot?: boolean;
    hasExpiringSoonLot?: boolean;
    nearestExpiryDate?: string;
    stockStatus?: InventoryStockStatus;
}

export interface InventoryLotRow {
    id: string;
    variantId: string;
    productId?: string;
    productName?: string;
    productWebName?: string;
    productCode?: string;
    productSlug?: string;
    productSku?: string;
    unitType?: string;
    specification?: string;
    lotNumber: string;
    expiryDate: string;
    receivedAt?: string;
    quantityOnHand: number;
    quantityReserved: number;
    quantityAvailable: number;
    status: InventoryLotStatus;
    unitCost?: number;
    daysLeft?: number;
}

export interface InventoryTransaction {
    id: string;
    productName?: string;
    variantId?: string;
    variantSku?: string;
    unitType?: string;
    specification?: string;
    salePrice?: number;
    averageImportCost?: number;
    lotId?: string;
    lotNumber?: string;
    type: string;
    quantity: number;
    unitCost?: number;
    note?: string;
    createdAt?: string;
}

export interface InventorySummaryPageData {
    inventories: InventorySummaryRow[];
    pagination?: Pagination;
}

export interface InventoryLotsPageData {
    summary: InventorySummaryRow | null;
    lots: InventoryLotRow[];
    pagination?: Pagination;
}

export interface InventoryLotDetail extends InventoryLotRow {
    transactions: InventoryTransaction[];
    variantSummary?: InventorySummaryRow | null;
}

export interface InventoryTransactionsPageData {
    summary?: InventorySummaryRow | null;
    transactions: InventoryTransaction[];
    pagination?: Pagination;
}

export interface InventoryExpiryAlertsPageData {
    lots: InventoryLotRow[];
    pagination?: Pagination;
}

export interface ImportStockPayload {
    variantId: string;
    lotNumber: string;
    expiryDate: string;
    quantity: number;
    unitCost: number;
    note?: string;
}

export interface InventorySummaryFiltersState {
    search: string;
}

export interface InventoryLotFiltersState {
    search: string;
    status: string;
}

export interface InventoryTransactionFiltersState {
    search: string;
    type: string;
}

export interface InventoryExpiryFiltersState {
    search: string;
    tab: 'expiring' | 'expired' | 'blocked';
    days: number;
}
