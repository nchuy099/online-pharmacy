import { Pagination } from '../../../shared/types';

export interface InventoryResponseDto {
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

export interface InventoryPageResponseDto {
    inventories: InventoryResponseDto[];
    pagination?: Pagination;
}

export interface TransactionResponseDto {
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

export interface TransactionPageResponseDto {
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
    inventories: InventoryResponseDto[];
    transactions: TransactionResponseDto[];
    pagination?: Pagination;
}

export interface ImportStockRequestDto {
    quantity: number;
    unitCost: number;
    note?: string;
}
