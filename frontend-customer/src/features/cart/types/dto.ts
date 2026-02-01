export interface CartProductInfoDTO {
    name: string;
    webName?: string;
    slug: string;
    imageUrl?: string;
    quantity: number;
    unitPrice: number;
    // New variant fields
    variantId?: string;
    variantName?: string;
    unit?: string;
    sku?: string;
    availableQuantity?: number | null;
}

export interface CartItemDTO {
    id: string;
    productInfo: CartProductInfoDTO;
    selected: boolean;
}

export interface CartDetailsResponseDTO {
    items: CartItemDTO[];
    cursor: {
        nextCursor: string | null;
        hasMore: boolean;
    };
    totalDistinctItems: number;
    selectedSummary: {
        grandTotal: number;
        totalDistinctItems: number;
    };
}

export interface AddItemToCartReqDTO {
    variantId: string;
    quantity: number;
}

export interface UpdateCartItemReqDTO {
    itemId: string;
    quantity?: number;
    selected?: boolean;
}
