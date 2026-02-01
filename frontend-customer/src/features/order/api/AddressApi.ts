import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type {
    AddressDTO,
    CreateAddressReqDTO,
    UpdateAddressReqDTO,
    AddressListRespDTO
} from "../types/dto";
import { extractApiMessage } from "../utils/error";

const BASE_URL = "/users/me/addresses";

export const AddressApi = {
    async getList(page: number = 1, size: number = 10): Promise<AddressListRespDTO> {
        try {
            const res = await axios.get<ApiResponse<AddressListRespDTO>>(`${BASE_URL}/list`, {
                params: { page, size }
            });
            if (!res.data.success) {
                throw new Error(res.data.message || res.data.error || "Fetch addresses failed");
            }
            return res.data.data;
        } catch (error) {
            throw new Error(extractApiMessage(error, "Fetch addresses failed"));
        }
    },

    async create(req: CreateAddressReqDTO): Promise<AddressDTO> {
        try {
            const res = await axios.post<ApiResponse<AddressDTO>>(`${BASE_URL}/create`, req);
            if (!res.data.success) {
                throw new Error(res.data.message || res.data.error || "Create address failed");
            }
            return res.data.data;
        } catch (error) {
            throw new Error(extractApiMessage(error, "Create address failed"));
        }
    },

    async update(id: string, req: UpdateAddressReqDTO): Promise<AddressDTO> {
        try {
            const res = await axios.put<ApiResponse<AddressDTO>>(`${BASE_URL}/${id}/update`, req);
            if (!res.data.success) {
                throw new Error(res.data.message || res.data.error || "Update address failed");
            }
            return res.data.data;
        } catch (error) {
            throw new Error(extractApiMessage(error, "Update address failed"));
        }
    },

    async delete(id: string): Promise<{ id: string }> {
        try {
            const res = await axios.delete<ApiResponse<{ id: string }>>(`${BASE_URL}/delete`, {
                data: { id }
            });
            if (!res.data.success) {
                throw new Error(res.data.message || res.data.error || "Delete address failed");
            }
            return res.data.data;
        } catch (error) {
            throw new Error(extractApiMessage(error, "Delete address failed"));
        }
    }
};
