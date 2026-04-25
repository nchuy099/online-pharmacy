import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type { FlashSaleCampaignDTO, FlashSaleClaimRequestDTO, FlashSaleClaimResponseDTO, FlashSaleItemDTO } from "../types";

export const flashSaleApi = {
    async claim(itemId: string, data: FlashSaleClaimRequestDTO): Promise<FlashSaleClaimResponseDTO> {
        const res = await axios.post<ApiResponse<FlashSaleClaimResponseDTO>>(`/flash-sales/items/${itemId}/claim`, data);
        if (!res.data.success) {
            throw new Error(res.data.error || "Unable to claim flash sale stock");
        }
        return res.data.data;
    },

    async getActiveFlashSales(): Promise<FlashSaleItemDTO[]> {
        const res = await axios.get<ApiResponse<FlashSaleItemDTO[]>>("/flash-sales/active");
        if (!res.data.success) {
            throw new Error(res.data.error || "Unable to load flash sale items");
        }
        return res.data.data;
    },

    async getCampaigns(): Promise<FlashSaleCampaignDTO[]> {
        const res = await axios.get<ApiResponse<FlashSaleCampaignDTO[]>>("/flash-sales/campaigns");
        if (!res.data.success) {
            throw new Error(res.data.error || "Unable to load flash sale campaigns");
        }
        return res.data.data;
    },

    async getBigEvents(): Promise<FlashSaleCampaignDTO[]> {
        const res = await axios.get<ApiResponse<FlashSaleCampaignDTO[]>>("/flash-sales/events");
        if (!res.data.success) {
            throw new Error(res.data.error || "Unable to load flash sale events");
        }
        return res.data.data;
    },

    async getBigEvent(campaignCode: string): Promise<FlashSaleCampaignDTO> {
        const res = await axios.get<ApiResponse<FlashSaleCampaignDTO>>(`/flash-sales/events/${campaignCode}`);
        if (!res.data.success) {
            throw new Error(res.data.error || "Unable to load flash sale event");
        }
        return res.data.data;
    },
};
