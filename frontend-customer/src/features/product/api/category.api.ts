import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type { CategoryDTO } from "../types/dto";

export const categoryApi = {
    getCategoryList: async (): Promise<CategoryDTO[]> => {
        const res = await axios.get<ApiResponse<CategoryDTO[]>>("/categories/list");
        if (!res.data.success) {
            throw new Error(res.data.error || "Fetch categories failed");
        }
        return res.data.data;
    },
};
