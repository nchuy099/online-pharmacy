import { chatApi } from "../api/chat.api";
import {
    mapChatRoom,
    mapChatMessage
} from "../mappers/chat.mapper";
import type {
    ChatRoom,
    ChatMessage,
    HealthProfile,
    ConsultationSpecialty,
} from "../types/domain";

export const chatService = {
    // Health Profile
    getHealthProfile: async (): Promise<HealthProfile | null> => {
        return await chatApi.getHealthProfile();
    },

    saveHealthProfile: async (data: HealthProfile): Promise<HealthProfile> => {
        return await chatApi.saveHealthProfile(data);
    },

    // Chat
    createChatRoom: async (data: { type: string; participantIds: string[]; consultationId?: string }): Promise<ChatRoom> => {
        const dto = await chatApi.createChatRoom(data);
        return mapChatRoom(dto);
    },

    getMyChatRooms: async (): Promise<ChatRoom[]> => {
        const dtos = await chatApi.getMyChatRooms();
        return dtos.map(mapChatRoom);
    },

    getRoomMessages: async (roomId: string): Promise<ChatMessage[]> => {
        const resp = await chatApi.getRoomMessages(roomId, 0, 100);
        return (resp.content || []).map(mapChatMessage).reverse();
    },

    getConsultationSpecialties: async (): Promise<ConsultationSpecialty[]> => {
        const dtos = await chatApi.getConsultationSpecialties();
        return dtos.map(dto => ({
            id: dto.id,
            code: dto.code,
            name: dto.name,
        }));
    },

    sendAiMessage: async (message: string, conversationId?: string): Promise<ChatMessage> => {
        const dto = await chatApi.sendAiMessage(message, conversationId);
        return mapChatMessage(dto);
    },

    startNewAiConversation: (): string => {
        return chatApi.startNewAiConversation();
    },
};
