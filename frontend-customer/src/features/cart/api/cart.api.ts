import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type {
    CartDetailsResponseDTO,
    AddItemToCartReqDTO,
    UpdateCartItemReqDTO
} from "../types/dto";

export const cartApi = {
    getCartDetails: async (size: number, cursor?: string): Promise<CartDetailsResponseDTO> => {
        const res = await axios.get<ApiResponse<CartDetailsResponseDTO>>("/cart/details", {
            params: { size, cursor }
        });
        if (!res.data.success) {
            throw new Error(res.data.error || "Fetch cart details failed");
        }
        return res.data.data;
    },

    addItem: async (data: AddItemToCartReqDTO): Promise<void> => {
        const res = await axios.post<ApiResponse<void>>("/cart/items/add", data);
        if (!res.data.success) {
            throw new Error(res.data.error || "Add item failed");
        }
    },

    updateItem: async (data: UpdateCartItemReqDTO): Promise<void> => {
        // According to backend mapping: PUT /cart/items/{id}/update
        const { itemId, ...updateData } = data;
        const res = await axios.put<ApiResponse<void>>(`/cart/items/${itemId}/update`, updateData);
        if (!res.data.success) {
            throw new Error(res.data.error || "Update item failed");
        }
    },

    removeItem: async (itemId: string): Promise<void> => {
        // According to backend mapping: DELETE /cart/items/{id}/remove
        const res = await axios.delete<ApiResponse<void>>(`/cart/items/${itemId}/remove`);
        if (!res.data.success) {
            throw new Error(res.data.error || "Remove item failed");
        }
    },

    removeAll: async (): Promise<void> => {
        // According to backend mapping: DELETE /cart/clear
        const res = await axios.delete<ApiResponse<void>>("/cart/clear");
        if (!res.data.success) {
            throw new Error(res.data.error || "Clear cart failed");
        }
    }
};
