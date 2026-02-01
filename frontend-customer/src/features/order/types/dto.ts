import type { Pagination } from "@/features/shared/api/types/api";
import type { RawOrderResp } from "../mappers/order.mapper";
import type { OrderMode, PaymentMethod } from "./order.constant";

// Order DTOs
export interface OrderItemDTO {
    id?: string;
    productId: string;
    variantId?: string;
    productName?: string;
    productWebName?: string;
    variantName?: string;
    unit?: string;
    sku?: string;
    unitPrice: number;
    quantity: number;
    availableQuantity?: number;
    productImageUrl?: string;
    productImage?: string;
    productSlug?: string;
    slug?: string;
    name?: string;
}

export interface ShippingMethodDTO {
    serviceId: number;
    name: string;
    fee: number;
    expectedDeliveryTime?: number;
}

export interface OrderShippingDTO {
    serviceId: number;
    shippingFee: number;
    expectedDeliveryTime: number;
}

export interface OrderCheckoutRespDTO {
    items: OrderItemDTO[];
    itemTotalAmount?: number;
    finalAmount: number;

    shippingFee: number;
    shippingMethods?: ShippingMethodDTO[];
    checkoutQuoteId?: string | null;
    checkoutQuoteExpiresAt?: number | null;
}

export interface OrderHistoryRespDTO {
    pagination: Pagination;
    orders: RawOrderResp[];
}

export interface BuyNowItemDTO {
    variantId: string;
    quantity: number;
}

export interface CreateOrderCheckoutReqDTO {
    mode: OrderMode;
    buyNowItem?: BuyNowItemDTO;
    addressId?: string;
    serviceId?: number;
    note?: string;
}

export interface CreateOrderReqDTO {
    checkoutQuoteId: string;
    paymentMethod: PaymentMethod;
    mode: OrderMode;
    buyNowItem?: BuyNowItemDTO;
    note?: string;
}

export interface UpdateOrderDeliveryInfoReqDTO {
    shippingInfo: {
        fullName: string;
        phoneNumber: string;
        address: string;
        provinceName?: string;
        districtName?: string;
        wardName?: string;
        fullAddress?: string;
    };
    note?: string;
}

export interface CancelOrderReqDTO {
    reason?: string;
}

// Address DTOs
export interface AddressDTO {
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

export interface CreateAddressReqDTO {
    fullName: string;
    phoneNumber: string;
    address: string;
    ghnProvinceId: number;
    ghnDistrictId: number;
    ghnWardCode: string;
    provinceName: string;
    districtName: string;
    wardName: string;
    isDefault?: boolean;
}

export interface UpdateAddressReqDTO {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    ghnProvinceId?: number;
    ghnDistrictId?: number;
    ghnWardCode?: string;
    provinceName?: string;
    districtName?: string;
    wardName?: string;
    isDefault?: boolean;
}

export interface AddressListRespDTO {
    addresses: AddressDTO[];
    pagination: {
        page: number;
        size: number;
        totalPages: number;
        totalElements: number;
    };
}
