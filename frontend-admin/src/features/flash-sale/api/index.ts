import axios from "../../../shared/services/axios";
import { ApiResponse } from "../../../shared/types";
import {
    CreateFlashSaleCampaignDTO,
    CreateFlashSaleCampaignItemDTO,
    GenerateRandomFlashSaleCampaignDTO,
    FlashSaleCampaignDTO,
    FlashSaleCampaignPageDTO,
    UpdateFlashSaleCampaignDTO,
} from "../types/dto";

const flashSaleApi = {
    async list(page: number = 1, size: number = 10): Promise<ApiResponse<FlashSaleCampaignPageDTO>> {
        const res = await axios.get("/admin/flash-sales", { params: { page, size } });
        return res.data;
    },

    async get(id: string): Promise<ApiResponse<FlashSaleCampaignDTO>> {
        const res = await axios.get(`/admin/flash-sales/${id}`);
        return res.data;
    },

    async create(payload: CreateFlashSaleCampaignDTO): Promise<ApiResponse<FlashSaleCampaignDTO>> {
        const res = await axios.post("/admin/flash-sales", payload);
        return res.data;
    },

    async randomDraft(payload: GenerateRandomFlashSaleCampaignDTO): Promise<ApiResponse<FlashSaleCampaignDTO>> {
        const res = await axios.post("/admin/flash-sales/random-draft", payload);
        return res.data;
    },

    async update(id: string, payload: UpdateFlashSaleCampaignDTO): Promise<ApiResponse<FlashSaleCampaignDTO>> {
        const res = await axios.put(`/admin/flash-sales/${id}`, payload);
        return res.data;
    },

    async publish(id: string): Promise<ApiResponse<FlashSaleCampaignDTO>> {
        const res = await axios.post(`/admin/flash-sales/${id}/publish`);
        return res.data;
    },

    async cancel(id: string): Promise<ApiResponse<FlashSaleCampaignDTO>> {
        const res = await axios.post(`/admin/flash-sales/${id}/cancel`);
        return res.data;
    },

    async addItem(campaignId: string, payload: CreateFlashSaleCampaignItemDTO): Promise<ApiResponse<FlashSaleCampaignDTO>> {
        const res = await axios.post(`/admin/flash-sales/${campaignId}/items`, payload);
        return res.data;
    },

    async updateItem(campaignId: string, itemId: string, payload: CreateFlashSaleCampaignItemDTO): Promise<ApiResponse<FlashSaleCampaignDTO>> {
        const res = await axios.put(`/admin/flash-sales/${campaignId}/items/${itemId}`, payload);
        return res.data;
    },

    async deleteItem(campaignId: string, itemId: string): Promise<ApiResponse<FlashSaleCampaignDTO>> {
        const res = await axios.delete(`/admin/flash-sales/${campaignId}/items/${itemId}`);
        return res.data;
    },
};

export default flashSaleApi;
