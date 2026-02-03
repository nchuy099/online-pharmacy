export interface ChatMessageRespDTO {
    id: string;
    chatRoomId?: string;
    senderId: string;
    senderType: "CUSTOMER" | "PHARMACIST" | "AI" | "SYSTEM";
    content: string;
    type: "TEXT" | "IMAGE" | "FILE" | "DRUG_RECOMMEND" | "PRESCRIPTION";
    status: "SENT" | "DELIVERED" | "READ";
    createdAt: string;
}

export interface ChatRoomRespDTO {
    id: string;
    consultationId?: string;
    participantIds: string[];
    type: "PHARMACIST" | "AI";
    status: "ACTIVE" | "CLOSED" | "WAITING";
    title?: string;
    pharmacistName?: string;
    createdAt: string;
    updatedAt: string;
    lastMessage?: ChatMessageRespDTO;
}

export interface ChatMessagesListRespDTO {
    content: ChatMessageRespDTO[];
    totalPages: number;
}

export interface CatalogOptionRespDTO {
    id: string;
    type: string;
    code: string;
    name: string;
    parentId?: string;
    parentCode?: string;
    parentName?: string;
}

export interface PrescriptionItemDTO {
    id: string;
    productId: string;
    productName: string;
    productWebName?: string;
    productImageUrl?: string;
    productSlug?: string;
    variantId?: string;
    variantName?: string;
    unit?: string;
    sku?: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
}

export interface PrescriptionDTO {
    id: string;
    customerId: string;
    customerName: string;
    pharmacistId: string;
    pharmacistName: string;
    diagnosis: string;
    generalInstructions?: string;
    followUpDate?: string;
    createdAt: string;
    items: PrescriptionItemDTO[];
}
