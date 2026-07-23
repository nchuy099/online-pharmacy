import { Pagination } from '../../../shared/types';

export type OrderStatus = 'PENDING_PAYMENT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'RETURN_REQUESTED' | 'RETURNED' | 'CANCELLED';

export interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
}

export interface PaymentInfo {
    method: string;
    amount: number;
    status: string;
}

export interface Order {
    id: string;
    orderCode: string;
    paymentMethod: string;
    items?: OrderItem[]; // Optional in list
    finalAmount: number;
    note?: string;
    status: OrderStatus;
    totalItems: number; // Added
}

export interface ShipmentLog {
    status: string;
    updatedDate: string;
}

export interface ShipmentInfo {
    orderCode: string;
    status: string;
    fromName: string;
    fromPhone: string;
    fromAddress: string;
    toName: string;
    toPhone: string;
    toAddress: string;
    weight: number;
    leadtime: string;
    log: ShipmentLog[];
}

export interface OrderDetails extends Order {
    payment: PaymentInfo;
    shipment?: ShipmentInfo;
}

export interface OrderPage {
    orders: Order[];
    pagination?: Pagination;
}
