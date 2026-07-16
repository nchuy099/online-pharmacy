import { OrderApi } from "../api/order.api";
import type { Pagination } from "@/features/shared/api/types/api";
import type {
    Order,
    OrderCheckout,
    ShippingInfo,
} from "../types/domain";
import {
    mapCheckoutResponse,
    mapOrderDetailsResponse,
    mapOrderHistoryResponse,
} from "../mappers/order.mapper";
import type { CreateOrderReqDTO, CreateOrderCheckoutReqDTO } from "../types/dto";

export const orderService = {
    checkout: async (
        data: CreateOrderCheckoutReqDTO
    ): Promise<OrderCheckout> => {
        const resp = await OrderApi.checkout(data);
        return mapCheckoutResponse(resp);
    },

    create: async (
        data: CreateOrderReqDTO
    ): Promise<Order> => {
        const resp = await OrderApi.create(data);
        return mapOrderDetailsResponse(resp);
    },

    updateDeliveryInfo: async (
        orderId: string,
        shippingInfo: ShippingInfo,
        note?: string
    ): Promise<void> => {
        return OrderApi.updateDeliveryInfo(orderId, {
            shippingInfo,
            note,
        });
    },

    cancel: async (orderId: string, reason?: string): Promise<void> => {
        return OrderApi.cancel(orderId, { reason });
    },

    uploadReturnEvidence: async (orderId: string, file: File): Promise<string> => {
        const payload = await OrderApi.createReturnEvidenceUploadUrl(orderId);
        const response = await fetch(payload.uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type,
            },
            body: file,
        });
        if (!response.ok) {
            throw new Error(`Upload return evidence failed (${response.status} ${response.statusText})`);
        }
        return payload.fileUrl;
    },

    createReturnRequest: async (orderId: string, reason: string, imageUrls: string[] = []): Promise<Order> => {
        const resp = await OrderApi.createReturnRequest(orderId, { reason, imageUrls });
        return mapOrderDetailsResponse(resp);
    },

    getDetails: async (orderId: string): Promise<Order> => {
        const resp = await OrderApi.getDetails(orderId);
        return mapOrderDetailsResponse(resp);
    },

    getHistory: async (page: number = 1, size: number = 10): Promise<{ pagination: Pagination; orders: Order[] }> => {
        const resp = await OrderApi.getHistory(page, size);
        return mapOrderHistoryResponse(resp);
    },
};
