export interface CartItem {
    id: string;
    productName: string;
    variantId: string;
    variantName: string;
    unit: string;
    sku?: string | null;
    slug: string;
    thumbnail?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    availableQuantity?: number | null;
    selected: boolean;
}

export interface CartDetails {
    items: CartItem[];
    totalItems: number;
    selectedTotal: number;
    selectedCount: number;
    hasMore: boolean;
    nextCursor: string | null;
}
