import axios from "@/features/shared/api/axios";
import axiosLib from "axios";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type {
    ChatMessageRespDTO,
    ChatRoomRespDTO,
    ChatMessagesListRespDTO,
    PrescriptionDTO,
    CatalogOptionRespDTO,
} from "../types/dto";
import type { HealthProfile } from "../types/domain";

const CHATBOT_AI_TIMEOUT_MS = 120000;

const getChatbotConversationId = (): string => {
    const key = "chatbot_ai_conversation_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const sid = uuidv4();
    localStorage.setItem(key, sid);
    return sid;
};

const resetChatbotConversationId = (): string => {
    const key = "chatbot_ai_conversation_id";
    const next = uuidv4();
    localStorage.setItem(key, next);
    return next;
};

export const chatApi = {
    // --- Health Profile APIs ---
    getHealthProfile: async (): Promise<HealthProfile | null> => {
        try {
            const response = await axios.get<ApiResponse<HealthProfile>>("/health-profile/me");
            return response.data.data;
        } catch {
            return null;
        }
    },

    saveHealthProfile: async (data: HealthProfile): Promise<HealthProfile> => {
        const response = await axios.put<ApiResponse<HealthProfile>>("/health-profile/me", data);
        return response.data.data;
    },

    // --- Chat APIs ---
    createChatRoom: async (data: { type: string; participantIds: string[]; consultationId?: string }): Promise<ChatRoomRespDTO> => {
        const response = await axios.post<ApiResponse<ChatRoomRespDTO>>("/chat/rooms", data);
        return response.data.data;
    },

    getMyChatRooms: async (): Promise<ChatRoomRespDTO[]> => {
        const response = await axios.get<ApiResponse<ChatRoomRespDTO[]>>("/chat/rooms/me");
        return response.data.data || [];
    },

    getRoomMessages: async (roomId: string, page: number = 0, size: number = 100): Promise<ChatMessagesListRespDTO> => {
        const response = await axios.get<ApiResponse<{ content: ChatMessageRespDTO[]; totalPages: number }>>(`/chat/rooms/${roomId}/messages`, {
            params: { page, size },
        });
        const data = response.data.data;
        return {
            content: data?.content || [],
            totalPages: data?.totalPages || 0,
        };
    },

    getConsultationSpecialties: async (): Promise<CatalogOptionRespDTO[]> => {
        const response = await axios.get<ApiResponse<CatalogOptionRespDTO[]>>("/chat/specialties");
        return response.data.data || [];
    },

    sendAiMessage: async (message: string, conversationId?: string): Promise<ChatMessageRespDTO> => {
        const effectiveConversationId = (conversationId && conversationId.trim())
            ? conversationId.trim()
            : getChatbotConversationId();
        try {
            const response = await axios.post<ApiResponse<ChatMessageRespDTO>>("/chat/ai", {
                conversationId: effectiveConversationId,
                message,
            }, {
                timeout: CHATBOT_AI_TIMEOUT_MS,
            });
            return response.data.data;
        } catch (error) {
            if (axiosLib.isAxiosError(error)) {
                console.error("[ChatbotAI] request failed", {
                    code: error.code,
                    message: error.message,
                    status: error.response?.status,
                    conversationId: effectiveConversationId,
                });
            } else {
                console.error("[ChatbotAI] request failed (unknown error)", {
                    conversationId: effectiveConversationId,
                    error,
                });
            }
            throw error;
        }
    },

    startNewAiConversation: (): string => {
        return resetChatbotConversationId();
    },

    // --- Prescription APIs ---
    getMyPrescriptions: async (page = 0, size = 10): Promise<{ content: PrescriptionDTO[]; totalPages: number; totalElements: number }> => {
        const response = await axios.get<ApiResponse<{ content: PrescriptionDTO[]; totalPages: number; totalElements: number }>>("/customers/me/prescriptions", { params: { page, size } });
        return response.data.data || { content: [], totalPages: 0, totalElements: 0 };
    },
};
