import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type { UserProfileResponse } from "../types/dto";

export const getMe = async (accessToken?: string): Promise<UserProfileResponse> => {
    const res = await axios.get<ApiResponse<UserProfileResponse>>("/users/me/details", accessToken
        ? {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
        : undefined);

    if (!res.data.success) {
        throw new Error(res.data.error || "Failed to fetch user profile");
    }

    return res.data.data;
};

export const updateMe = async (data: any): Promise<UserProfileResponse> => {
    const res = await axios.put<ApiResponse<UserProfileResponse>>("/users/me/update", data);

    if (!res.data.success) {
        throw new Error(res.data.error || "Failed to update user profile");
    }

    return res.data.data;
};
