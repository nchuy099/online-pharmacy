import { Pagination } from '../../../shared/types';

export type OrderStatus = 'PENDING' | 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
    id: string;
    productName: string;
    productSlug?: string;
    quantity: number;
    unitPrice: number;
}

export interface PaymentInfo {
    method: string;
    amount: number;
    status: string;
}

export interface AddressInfo {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    provinceName?: string;
    districtName?: string;
    wardName?: string;
    fullAddress?: string;
}

export interface Order {
    id: string;
    orderCode: string;
    paymentMethod: string;
    items?: OrderItem[]; // Optional in list
    finalAmount: number;
    shippingFee?: number;
    ghnServiceId?: number;
    expectedDeliveryTime?: number;
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
    address?: AddressInfo;
    shipment?: ShipmentInfo;
}

export interface OrderPage {
    orders: Order[];
    pagination?: Pagination;
}
