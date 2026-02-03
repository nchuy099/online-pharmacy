import type {
    ChatMessage,
    ChatRoom
} from "../types/domain";
import type {
    ChatMessageRespDTO,
    ChatRoomRespDTO
} from "../types/dto";

export const mapChatMessage = (dto: ChatMessageRespDTO): ChatMessage => ({
    id: dto.id,
    chatRoomId: dto.chatRoomId,
    senderId: dto.senderId,
    senderType: dto.senderType,
    content: dto.content,
    type: dto.type,
    status: dto.status || "SENT",
    createdAt: dto.createdAt
});

export const mapChatRoom = (dto: ChatRoomRespDTO): ChatRoom => ({
    id: dto.id,
    consultationId: dto.consultationId,
    participantIds: dto.participantIds,
    type: dto.type,
    status: dto.status,
    title: dto.title,
    pharmacistName: dto.pharmacistName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    lastMessage: dto.lastMessage ? mapChatMessage(dto.lastMessage) : undefined
});
