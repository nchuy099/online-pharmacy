export type SessionStatus = 'WAITING' | 'ACTIVE' | 'CLOSED';
export type PharmacistStatus = 'ONLINE' | 'OFFLINE' | 'BUSY';
export type SenderType = 'CUSTOMER' | 'PHARMACIST' | 'SYSTEM';

export interface ChatSession {
    id: string;
    customerName: string;
    customerId: string;
    status: SessionStatus;
    specialty?: string;
    startedAt: string;
    lastMessageAt?: string;
    unreadCount: number;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderType: SenderType;
    content: string;
    type: 'TEXT' | 'SYSTEM' | 'DRUG_RECOMMEND' | 'PRESCRIPTION';
    metadata?: any;
    createdAt: string;
}

export interface CustomerInfo {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    allergies?: string;
    purchaseHistory: PatientPurchaseItem[];
}

export interface PharmacistProductVariant {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unit: string;
    sku?: string | null;
    specification?: string | null;
    salePrice?: number | null;
    availableQuantity?: number | null;
    isActive: boolean;
    primaryImage?: string | null;
}

export interface ProductSearchOption {
    label: string;
    value: string; // variantId
    productId: string;
    productName: string;
    variantName: string;
    unit: string;
    sku?: string | null;
    salePrice?: number | null;
    availableQuantity?: number | null;
    primaryImage?: string | null;
}

export interface DrugRecommendation {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unit: string;
    salePrice?: number;
    availableQuantity?: number;
    primaryImage?: string | null;
    quantity: number;
}

export interface PatientPurchaseItem {
    orderId: string;
    orderedAt: string;
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    orderStatus: string;
}

export type ChatPrescriptionMessage = {
    type: "PRESCRIPTION";
    prescriptionId?: string | null;
    items: Array<{
        productName: string;
        variantName?: string | null;
        unit?: string | null;
        quantity: number;
        dosage?: string | null;
        frequency?: string | null;
        duration?: string | null;
        instructions?: string | null;
    }>;
};

export type ChatProductRecommendationMessage = {
    type: "PRODUCT_RECOMMENDATION";
    items: Array<{
        productId?: string | null;
        variantId?: string | null;
        productName: string;
        variantName?: string | null;
        salePrice?: number | null;
        unit?: string | null;
        slug?: string | null;
    }>;
};
