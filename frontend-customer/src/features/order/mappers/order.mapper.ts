import type {
    OrderCheckoutRespDTO,
    OrderHistoryRespDTO,
} from "../types/dto";
import type { Pagination } from "@/features/shared/api/types/api";
import type {
    Order,
    OrderCheckout,
    OrderItem,
} from "../types/domain";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "../types/order.constant";

export interface RawOrderItemResp {
    productId?: string;
    id?: string;
    variantId?: string;
    productName?: string;
    name?: string;
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
    review?: {
        id: string;
        rating: number;
        comment: string;
        createdAt: string;
        canEdit: boolean;
    };
}

export interface RawOrderResp {
    id: string;
    orderCode?: string;
    items?: RawOrderItemResp[];
    address?: {
        fullName?: string;
        phoneNumber?: string;
        address?: string;
        provinceName?: string;
        districtName?: string;
        wardName?: string;
        fullAddress?: string;
    };
    payment?: {
        amount: number;
        method: string;
        status: string;
    };
    itemTotalAmount?: number;
    finalAmount: number;

    shippingFee?: number;
    status: string;
    note?: string;
    createdAt: string;
    expectedDeliveryTime?: number;
    shipment?: {
        order_code: string;
        status: string;
        log: {
            status: string;
            updated_date: string;
        }[];
    };
    paymentUrl?: string;
    bankName?: string;
    bankAccount?: string;
}

/**
 * Transform OrderCheckoutRespDTO (API response) to OrderCheckout (domain model)
 */
export const mapCheckoutResponse = (resp: OrderCheckoutRespDTO): OrderCheckout => {
    return {
        items: resp.items.map((item) => ({
            id: item.id || "",
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName || item.name || "",
            productWebName: item.productWebName || item.productName || item.name || "",
            variantName: item.variantName,
            unit: item.unit,
            sku: item.sku,
            productSlug: item.productSlug || item.slug,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            availableQuantity: item.availableQuantity || 0,
            productImageUrl: item.productImageUrl || item.productImage,
        })),
        itemTotalAmount: resp.itemTotalAmount || resp.finalAmount,
        finalAmount: resp.finalAmount,

        shippingFee: resp.shippingFee || 0,
        shippingMethods: resp.shippingMethods?.map(method => ({
            serviceId: method.serviceId,
            name: method.name,
            fee: method.fee,
            expectedDeliveryTime: method.expectedDeliveryTime
        })) || [],
        checkoutQuoteId: resp.checkoutQuoteId || null,
        checkoutQuoteExpiresAt: resp.checkoutQuoteExpiresAt || null,
    };
};

/**
 * Transform OrderDetailsResp (API response) to Order (domain model)
 */
export const mapOrderDetailsResponse = (resp: RawOrderResp): Order => {
    return {
        id: resp.id,
        orderCode: resp.orderCode || null,
        items: (resp.items || []).map((item: RawOrderItemResp): OrderItem => ({
            id: item.id || "",
            productId: item.productId || item.id || "",
            variantId: item.variantId,
            productName: item.productName || item.name || "",
            productWebName: item.productWebName || item.productName || item.name || "",
            variantName: item.variantName,
            unit: item.unit,
            sku: item.sku,
            productSlug: item.productSlug || item.slug,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            availableQuantity: item.availableQuantity || 0,
            productImageUrl: item.productImageUrl || item.productImage,
            review: item.review,
        })),
        address: resp.address ? {
            fullName: resp.address.fullName || "",
            phoneNumber: resp.address.phoneNumber || "",
            address: resp.address.address || "",
            provinceName: resp.address.provinceName,
            districtName: resp.address.districtName,
            wardName: resp.address.wardName,
            fullAddress: resp.address.fullAddress,
        } : {
            fullName: "",
            phoneNumber: "",
            address: "",
        },
        payment: resp.payment ? {
            amount: resp.payment.amount,
            method: resp.payment.method as PaymentMethod,
            status: resp.payment.status as PaymentStatus,
        } : {
            amount: 0,
            method: "COD" as PaymentMethod,
            status: "INITIATED" as PaymentStatus,
        },
        itemTotalAmount: resp.itemTotalAmount || 0,
        finalAmount: resp.finalAmount || 0,

        shippingFee: resp.shippingFee || 0,
        status: resp.status as OrderStatus,
        note: resp.note,
        createdAt: resp.createdAt,
        expectedDeliveryTime: resp.expectedDeliveryTime,
        shipment: resp.shipment ? {
            orderCode: resp.shipment.order_code,
            status: resp.shipment.status,
            log: (resp.shipment.log || []).map(l => ({
                status: l.status,
                updatedDate: l.updated_date
            }))
        } : undefined,
        paymentUrl: resp.paymentUrl,
        bankName: resp.bankName,
        bankAccount: resp.bankAccount,
    };
};

/**
 * Transform OrderHistoryRespDTO (API response) to domain model
 */
export const mapOrderHistoryResponse = (
    resp: OrderHistoryRespDTO
): { pagination: Pagination; orders: Order[] } => {
    return {
        pagination: resp.pagination,
        orders: resp.orders.map(mapOrderDetailsResponse),
    };
};
