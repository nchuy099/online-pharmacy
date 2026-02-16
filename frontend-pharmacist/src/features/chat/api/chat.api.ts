import axiosInstance from '../../../shared/api/axiosInstance';
import type { RoomDTO, CustomerProfileDTO, ProductVariantDTO, CategoryDTO, MessageDTO, PageableDTO } from '../types/dto';

type ProductListVariantResponse = {
    id?: string;
    sku?: string | null;
    unitType?: string | null;
    specification?: string | null;
    salePrice?: number | null;
    quantityAvailable?: number | null;
};

type ProductListItemResponse = {
    id: string;
    name: string;
    primaryImage?: string | null;
    variants?: ProductListVariantResponse[];
};

type ProductListResponse = {
    products?: ProductListItemResponse[];
};

export const chatApi = {
    getRooms: async (): Promise<RoomDTO[]> => {
        const res = await axiosInstance.get<{ data: RoomDTO[] }>('/pharmacists/chat/rooms/active');
        return res.data.data || [];
    },

    joinRoom: async (roomId: string): Promise<void> => {
        await axiosInstance.post(`/pharmacists/chat/rooms/${roomId}/join`);
    },

    closeRoom: async (roomId: string): Promise<void> => {
        await axiosInstance.post(`/pharmacists/chat/rooms/${roomId}/close`);
    },

    getRoomMessages: async (roomId: string, page: number = 0, size: number = 100): Promise<PageableDTO<MessageDTO>> => {
        const res = await axiosInstance.get<{ data: PageableDTO<MessageDTO> }>(`/pharmacists/chat/rooms/${roomId}/messages`, {
            params: { page, size },
        });
        return res.data.data;
    },

    getCustomerProfile: async (customerId: string): Promise<CustomerProfileDTO> => {
        const res = await axiosInstance.get<{ data: CustomerProfileDTO }>(`/customers/${customerId}/chat-profile`);
        return res.data.data;
    },

    getCategories: async (): Promise<CategoryDTO[]> => {
        const res = await axiosInstance.get<{ data: CategoryDTO[] }>('/categories/list');
        return res.data.data || [];
    },

    searchProducts: async (query: string, categorySlug?: string): Promise<{ products: ProductVariantDTO[] }> => {
        const params: Record<string, string | number> = { search: query, size: 20 };
        if (categorySlug) params.categorySlug = categorySlug;

        const res = await axiosInstance.get<{ data: ProductListResponse }>('/products/list', {
            params,
            timeout: 30000,
        });
        const products = res.data.data?.products || [];

        const variants: ProductVariantDTO[] = products.flatMap((product) =>
            (product.variants || []).map((variant) => ({
                productId: product.id,
                variantId: variant.id || '',
                productName: product.name,
                variantName: variant.specification || variant.unitType || variant.sku || 'Phiên bản mặc định',
                unit: variant.unitType || 'UNIT',
                sku: variant.sku || null,
                specification: variant.specification || null,
                salePrice: variant.salePrice ?? null,
                availableQuantity: variant.quantityAvailable ?? null,
                isActive: true,
                primaryImage: product.primaryImage || null,
            }))
        ).filter((item) => Boolean(item.variantId));

        return { products: variants };
    },
};
