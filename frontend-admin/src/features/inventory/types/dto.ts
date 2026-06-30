import { Pagination } from '../../../shared/types';

export interface InventoryResponseDto {
    id?: string;
    variantId?: string;
    variant_id?: string;
    productId?: string;
    product_id?: string;
    productName?: string;
    product_name?: string;
    productWebName?: string;
    product_web_name?: string;
    productCode?: string;
    product_code?: string;
    productSlug?: string;
    product_slug?: string;
    productSku?: string;
    product_sku?: string;
    unitType?: string;
    unit_type?: string;
    specification?: string;
    quantityOnHand?: number;
    quantity_on_hand?: number;
    quantityReserved?: number;
    quantity_reserved?: number;
    quantityAvailable?: number;
    quantity_available?: number;
    salePrice?: number;
    sale_price?: number;
    averageImportCost?: number;
    average_import_cost?: number;
    hasExpiredLot?: boolean;
    has_expired_lot?: boolean;
    hasExpiringSoonLot?: boolean;
    has_expiring_soon_lot?: boolean;
    nearestExpiryDate?: string;
    nearest_expiry_date?: string;
}

export interface InventoryLotResponseDto {
    id?: string;
    variantId?: string;
    variant_id?: string;
    productId?: string;
    product_id?: string;
    productName?: string;
    product_name?: string;
    productWebName?: string;
    product_web_name?: string;
    productCode?: string;
    product_code?: string;
    productSlug?: string;
    product_slug?: string;
    productSku?: string;
    product_sku?: string;
    unitType?: string;
    unit_type?: string;
    specification?: string;
    lotNumber?: string;
    lot_number?: string;
    expiryDate?: string;
    expiry_date?: string;
    receivedAt?: string;
    received_at?: string;
    quantityOnHand?: number;
    quantity_on_hand?: number;
    quantityReserved?: number;
    quantity_reserved?: number;
    quantityAvailable?: number;
    quantity_available?: number;
    status?: string;
    unitCost?: number;
    unit_cost?: number;
}

export interface TransactionResponseDto {
    id: string;
    productName?: string;
    product_name?: string;
    variantId?: string;
    variant_id?: string;
    variantSku?: string;
    variant_sku?: string;
    unitType?: string;
    unit_type?: string;
    specification?: string;
    salePrice?: number;
    sale_price?: number;
    averageImportCost?: number;
    average_import_cost?: number;
    lotId?: string;
    lot_id?: string;
    lotNumber?: string;
    lot_number?: string;
    type: string;
    quantity: number;
    unitCost?: number;
    unit_cost?: number;
    note?: string;
    createdAt?: string;
    created_at?: string;
}

export interface InventoryPageResponseDto {
    inventories?: InventoryResponseDto[];
    items?: InventoryResponseDto[];
    pagination?: Pagination;
}

export interface InventoryLotsResponseDto {
    summary?: InventoryResponseDto;
    lots?: InventoryLotResponseDto[];
    items?: InventoryLotResponseDto[];
    pagination?: Pagination;
}

export interface TransactionPageResponseDto {
    productId?: string;
    productName?: string;
    productWebName?: string;
    productCode?: string;
    productSlug?: string;
    variantId?: string;
    variantSku?: string;
    unitType?: string;
    specification?: string;
    quantityOnHand?: number;
    quantityReserved?: number;
    quantityAvailable?: number;
    salePrice?: number;
    averageImportCost?: number;
    summary?: InventoryResponseDto;
    inventories?: InventoryResponseDto[];
    lots?: InventoryLotResponseDto[];
    transactions?: TransactionResponseDto[];
    items?: TransactionResponseDto[];
    pagination?: Pagination;
}

export interface ImportStockRequestDto {
    lotNumber: string;
    expiryDate: string;
    quantity: number;
    unitCost: number;
    note?: string;
}

export interface ImportStockResponseDto {
    summary?: InventoryResponseDto;
    lot?: InventoryLotResponseDto;
}
