export interface OrderItemResponse {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
}

export interface OrderResponse {
    id: string;
    orderCode: string;
    status: string;
    finalAmount: number;
    createdAt: string;
    items?: OrderItemResponse[];
}

export interface Pagination {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface PatientHistoryResponse {
    customerId: string;
    customerName: string;
    age?: number;
    gender?: string;
    allergies?: string;
    recentOrders: OrderResponse[];
    ordersPagination: Pagination;
    prescriptions: PrescriptionResponse[];
    prescriptionsPagination: Pagination;
}

export interface PrescriptionResponse {
    id: string;
    customerId: string;
    customerName: string;
    pharmacistId: string;
    pharmacistName: string;
    diagnosis: string;
    generalInstructions?: string;
    followUpDate?: string;
    createdAt: string;
    items: PrescriptionItemResponse[];
}

export interface PrescriptionItemResponse {
    id: string;
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unit: string;
    sku?: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
}

export interface PrescriptionRequest {
    customerId: string;
    diagnosis: string;
    generalInstructions?: string;
    followUpDate?: string; // ISO String
    items: PrescriptionItemRequest[];
}

export interface PrescriptionItemRequest {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unit: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}

export type PrescriptionDraftItem = {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unit: string;
    sku?: string | null;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions?: string | null;
};
