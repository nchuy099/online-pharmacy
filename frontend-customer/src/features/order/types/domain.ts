import type { OrderStatus, PaymentMethod, PaymentStatus } from "./order.constant";

export interface ShippingInfo {
    fullName: string;
    phoneNumber: string;
    address: string;
    provinceName?: string;
    districtName?: string;
    wardName?: string;
    fullAddress?: string;
}

export interface PaymentInfo {
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
}

export interface OrderItem {
    id: string;
    productId: string;
    variantId?: string;
    productName: string;
    productWebName: string;
    variantName?: string;
    unit?: string;
    sku?: string;
    productSlug?: string;
    unitPrice: number;
    quantity: number;
    availableQuantity: number;
    productImageUrl?: string;
    review?: {
        id: string;
        rating: number;
        comment: string;
        createdAt: string;
        canEdit: boolean;
    };
}

export interface ShipmentLog {
    status: string;
    updatedDate: string;
}

export interface ShipmentInfo {
    orderCode: string;
    status: string;
    log: ShipmentLog[];
}

export interface Order {
    id: string | null;
    orderCode: string | null;
    items: OrderItem[];
    address: ShippingInfo;
    payment: PaymentInfo;
    paymentUrl?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
    itemTotalAmount: number;
    finalAmount: number;

    shippingFee: number;
    status: OrderStatus;
    note?: string;
    createdAt: string;
    expectedDeliveryTime?: number;
    shipment?: ShipmentInfo;
}

export interface ShippingMethod {
    serviceId: number;
    name: string;
    fee: number;
    expectedDeliveryTime?: number;
}

export interface OrderCheckout {
    items: OrderItem[];
    itemTotalAmount: number;
    finalAmount: number;

    shippingFee: number;
    shippingMethods?: ShippingMethod[];
    checkoutQuoteId?: string | null;
    checkoutQuoteExpiresAt?: number | null;
}

export interface Address {
    id: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    ghnProvinceId: number;
    ghnDistrictId: number;
    ghnWardCode: string;
    provinceName: string;
    districtName: string;
    wardName: string;
    fullAddress?: string;
    isDefault: boolean;
}
