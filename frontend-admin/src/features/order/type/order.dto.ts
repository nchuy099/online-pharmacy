import { Pagination } from '../../../shared/types';

export interface OrderItemDto {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
}

export interface OrderResponse {
    id: string; // Updated from orderId
    orderCode: string;
    paymentMethod: string;
    items?: OrderItemDto[]; // Optional in list
    finalAmount: number;
    note?: string;
    status: string;
    totalItems: number; // Added
}

export interface OrderPaymentResponse {
    method: string;
    amount: number;
    status: string;
}

export interface ShipmentLogDto {
    status: string;
    updated_date: string;
}

export interface ShipmentInfoDto {
    order_code: string;
    status: string;
    from_name: string;
    from_phone: string;
    from_address: string;
    to_name: string;
    to_phone: string;
    to_address: string;
    weight: number;
    leadtime: string;
    log: ShipmentLogDto[];
}

export interface OrderDetailsResponse extends OrderResponse {
    payment: OrderPaymentResponse;
    shipment?: ShipmentInfoDto;
}

export interface OrderPageResponse {
    orders: OrderResponse[];
    pagination?: Pagination;
}
