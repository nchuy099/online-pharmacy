import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type {
    OrderCheckoutRespDTO,
    OrderHistoryRespDTO,
    CreateOrderReqDTO,
    CreateOrderCheckoutReqDTO,
    UpdateOrderDeliveryInfoReqDTO
} from "../types/dto";
import type { RawOrderResp } from "../mappers/order.mapper";

export const OrderApi = {
    checkout: async (data: CreateOrderCheckoutReqDTO): Promise<OrderCheckoutRespDTO> => {
        const res = await axios.post<ApiResponse<OrderCheckoutRespDTO>>("/orders/preview", data);
        if (!res.data.success) {
            throw new Error(res.data.error || "Checkout failed");
        }
        return res.data.data;
    },

    create: async (data: CreateOrderReqDTO): Promise<RawOrderResp> => {
        const res = await axios.post<ApiResponse<RawOrderResp>>("/orders/create", data);
        if (!res.data.success) {
            throw new Error(res.data.error || "Create order failed");
        }
        return res.data.data;
    },

    getDetails: async (orderId: string): Promise<RawOrderResp> => {
        const res = await axios.get<ApiResponse<RawOrderResp>>(`/orders/${orderId}/details`);
        if (!res.data.success) {
            throw new Error(res.data.error || "Fetch order details failed");
        }
        return res.data.data;
    },

    getHistory: async (page: number = 1, size: number = 10): Promise<OrderHistoryRespDTO> => {
        const res = await axios.get<ApiResponse<OrderHistoryRespDTO>>("/orders/history", {
            params: { page, size }
        });
        if (!res.data.success) {
            throw new Error(res.data.error || "Fetch order history failed");
        }
        return res.data.data;
    },

    cancel: async (orderId: string, data: { reason?: string }): Promise<void> => {
        const res = await axios.put<ApiResponse<void>>(`/orders/${orderId}/cancel`, data);
        if (!res.data.success) {
            throw new Error(res.data.error || "Cancel order failed");
        }
    },

    updateDeliveryInfo: async (orderId: string, data: UpdateOrderDeliveryInfoReqDTO): Promise<void> => {
        const res = await axios.put<ApiResponse<void>>(`/orders/${orderId}/delivery`, data);
        if (!res.data.success) {
            throw new Error(res.data.error || "Update delivery info failed");
        }
    }
};
