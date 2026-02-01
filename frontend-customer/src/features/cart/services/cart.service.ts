import { cartApi } from "../api/cart.api";
import type { CartItemDTO, AddItemToCartReqDTO, UpdateCartItemReqDTO } from "../types/dto";
import type { CartDetails, CartItem } from "../types/domain";

const mapCartItemDTOToDomain = (dto: CartItemDTO): CartItem => ({
    id: dto.id,
    productName: dto.productInfo.webName || dto.productInfo.name,
    variantId: dto.productInfo.variantId || "",
    variantName: dto.productInfo.variantName || "",
    unit: dto.productInfo.unit || "",
    sku: dto.productInfo.sku || null,
    slug: dto.productInfo.slug,
    thumbnail: dto.productInfo.imageUrl || null,
    quantity: dto.productInfo.quantity,
    unitPrice: dto.productInfo.unitPrice,
    lineTotal: dto.productInfo.unitPrice * dto.productInfo.quantity,
    availableQuantity: dto.productInfo.availableQuantity ?? null,
    selected: dto.selected,
});

export const cartService = {
    getCart: async (size: number, cursor?: string): Promise<CartDetails> => {
        const res = await cartApi.getCartDetails(size, cursor);
        return {
            items: res.items.map(mapCartItemDTOToDomain),
            totalItems: res.totalDistinctItems,
            selectedTotal: res.selectedSummary.grandTotal,
            selectedCount: res.selectedSummary.totalDistinctItems,
            hasMore: res.cursor?.hasMore ?? false,
            nextCursor: res.cursor?.nextCursor ?? null,
        };
    },

    addItem: async (data: AddItemToCartReqDTO) => {
        return await cartApi.addItem(data);
    },

    updateItem: async (data: UpdateCartItemReqDTO) => {
        return await cartApi.updateItem(data);
    },

    removeItem: async (itemId: string) => {
        return await cartApi.removeItem(itemId);
    },

    clearCart: async () => {
        return await cartApi.removeAll();
    }
};
