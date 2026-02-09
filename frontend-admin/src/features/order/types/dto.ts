import { Pagination } from '../../../shared/types';

export interface OrderItemDto {
    id: string;
    productName: string;
    productSlug?: string;
    quantity: number;
    unitPrice: number;
}

export interface OrderResponse {
    id: string;
    orderCode: string;
    paymentMethod: string;
    items?: OrderItemDto[];
    finalAmount: number;
    shippingFee?: number;
    ghnServiceId?: number;
    expectedDeliveryTime?: number;
    note?: string;
    status: string;
    totalItems: number;
}

export interface OrderPaymentResponse {
    method: string;
    amount: number;
    status: string;
}

export interface OrderAddressResponse {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    provinceName?: string;
    districtName?: string;
    wardName?: string;
    fullAddress?: string;
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
    address?: OrderAddressResponse;
    shipment?: ShipmentInfoDto;
}

export interface OrderPageResponse {
    orders: OrderResponse[];
    pagination?: Pagination;
}
