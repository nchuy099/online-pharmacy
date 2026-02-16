import { chatApi } from '../api/chat.api';
import type { RoomDTO, CustomerProfileDTO, ProductVariantDTO, MessageDTO } from '../types/dto';
import type { ChatSession, CustomerInfo, PharmacistProductVariant, ProductSearchOption, ChatMessage } from '../types/domain';
import { publishPharmacistRoomMessage } from '../../../shared/realtime/chatRoomSocket';

const mapRoomDTOToSession = (dto: RoomDTO): ChatSession => ({
    id: dto.id,
    customerName: dto.customerName || 'Khách hàng',
    customerId: dto.customerId,
    status: dto.status,
    specialty: dto.consultationId ? 'Tư vấn' : undefined,
    startedAt: dto.createdAt,
    lastMessageAt: dto.updatedAt,
    unreadCount: 0,
});

const mapCustomerProfileToDomain = (customerId: string, dto: CustomerProfileDTO): CustomerInfo => ({
    id: customerId,
    name: dto.fullName,
    gender: dto.gender,
    allergies: dto.allergies,
    purchaseHistory: [], // Will be filled by patient service if needed
});

const mapProductVariantDTOToDomain = (dto: ProductVariantDTO): PharmacistProductVariant => ({
    productId: dto.productId,
    variantId: dto.variantId,
    productName: dto.productName,
    variantName: dto.variantName,
    unit: dto.unit,
    sku: dto.sku,
    specification: dto.specification,
    salePrice: dto.salePrice,
    availableQuantity: dto.availableQuantity,
    isActive: dto.isActive,
    primaryImage: dto.primaryImage,
});

const mapProductVariantToSearchOption = (variant: PharmacistProductVariant): ProductSearchOption => ({
    label: `${variant.productName} - ${variant.variantName}`,
    value: variant.variantId,
    productId: variant.productId,
    productName: variant.productName,
    variantName: variant.variantName,
    unit: variant.unit,
    sku: variant.sku,
    salePrice: variant.salePrice,
    availableQuantity: variant.availableQuantity,
    primaryImage: variant.primaryImage,
});

const mapMessageDTOToDomain = (dto: MessageDTO): ChatMessage => ({
    id: dto.id,
    senderId: dto.senderId,
    senderType: dto.senderType,
    content: dto.content,
    type: dto.type || 'TEXT',
    metadata: dto.metadata,
    createdAt: dto.createdAt,
});

export const chatService = {
    getSessions: async (): Promise<ChatSession[]> => {
        const rooms = await chatApi.getRooms();
        return rooms.map(mapRoomDTOToSession);
    },

    getMessages: async (roomId: string): Promise<ChatMessage[]> => {
        const page = await chatApi.getRoomMessages(roomId, 0, 100);
        return (page.content || [])
            .map(mapMessageDTOToDomain)
            .reverse();
    },

    sendMessageRealtime: async (roomId: string, content: string, type: string = 'TEXT'): Promise<void> => {
        await publishPharmacistRoomMessage(roomId, { content, type });
    },

    joinSession: async (roomId: string): Promise<void> => {
        await chatApi.joinRoom(roomId);
    },

    closeSession: async (roomId: string): Promise<void> => {
        await chatApi.closeRoom(roomId);
    },

    getCustomerInfo: async (customerId: string): Promise<CustomerInfo> => {
        try {
            const profile = await chatApi.getCustomerProfile(customerId);
            return mapCustomerProfileToDomain(customerId, profile);
        } catch (error) {
            console.error('Failed to fetch customer profile:', error);
            return { id: customerId, name: 'Không xác định', purchaseHistory: [] };
        }
    },

    searchProducts: async (query: string, category?: string): Promise<ProductSearchOption[]> => {
        const data = await chatApi.searchProducts(query, category);
        const variants = (data.products || []).map(mapProductVariantDTOToDomain);
        return variants.map(mapProductVariantToSearchOption);
    },
};
