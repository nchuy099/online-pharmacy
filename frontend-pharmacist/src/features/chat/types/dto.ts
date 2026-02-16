export interface RoomDTO {
    id: string;
    customerName?: string;
    customerId: string;
    status: 'WAITING' | 'ACTIVE' | 'CLOSED';
    consultationId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MessageDTO {
    id: string;
    senderId: string;
    senderType: 'CUSTOMER' | 'PHARMACIST' | 'SYSTEM';
    content: string;
    type?: 'TEXT' | 'SYSTEM' | 'DRUG_RECOMMEND' | 'PRESCRIPTION';
    metadata?: any; // To store rich data like prescriptionId or productIds
    createdAt: string;
}

export interface CustomerProfileDTO {
    fullName: string;
    gender?: string;
    allergies?: string;
    recentDrugs?: string[];
}

export interface ProductVariantDTO {
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

export interface CategoryDTO {
    id: string;
    name: string;
    slug: string;
    level: number;
    productCount?: number;
    children?: CategoryDTO[];
}

export interface PageableDTO<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}
