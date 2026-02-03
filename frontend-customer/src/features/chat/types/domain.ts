export type ChatTab = "dashboard" | "schedule" | "search" | "cancel" | "pharmacists" | "health-profile";

export interface HealthProfile {
    fullName: string;
    yearOfBirth: number | null;
    gender: "MALE" | "FEMALE" | "OTHER" | "";
    weight: number | null;
    height: number | null;
    underlyingDiseases: string;
    drugAllergies: string;
    currentMedications: string;
    smoking: "NONE" | "SOMETIMES" | "OFTEN" | "";
    alcohol: "NONE" | "SOMETIMES" | "OFTEN" | "";
}

export type ChatMode = "instant" | "assisted" | "ai" | "history";

export interface ChatMessage {
    id: string;
    chatRoomId?: string;
    senderId: string;
    senderType: "CUSTOMER" | "PHARMACIST" | "AI" | "SYSTEM";
    content: string;
    type: "TEXT" | "IMAGE" | "FILE" | "DRUG_RECOMMEND" | "PRESCRIPTION";
    status: "SENT" | "DELIVERED" | "READ";
    createdAt: string;
}

export interface ChatRoom {
    id: string;
    consultationId?: string;
    participantIds: string[];
    type: "PHARMACIST" | "AI";
    status: "ACTIVE" | "CLOSED" | "WAITING";
    title?: string;
    pharmacistName?: string;
    createdAt: string;
    updatedAt: string;
    lastMessage?: ChatMessage;
}

export interface ConsultationSpecialty {
    id: string;
    code: string;
    name: string;
}
