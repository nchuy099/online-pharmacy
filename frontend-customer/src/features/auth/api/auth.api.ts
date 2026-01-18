import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";
import type {
    LoginRequestDTO,
    LoginResponseDTO,
    SignUpRequestDTO,
    RefreshTokenRequestDTO,
    RefreshTokenResponseDTO,
    CurrentRoleDTO
} from "../types/dto";

export const authApi = {
    login: async (data: LoginRequestDTO): Promise<LoginResponseDTO> => {
        const res = await axios.post<ApiResponse<LoginResponseDTO>>("/auth/login", data);
        if (!res.data.success) {
            throw new Error(res.data.error || "Login failed");
        }
        return res.data.data;
    },

    signUp: async (data: SignUpRequestDTO): Promise<null> => {
        const res = await axios.post<ApiResponse<null>>("/auth/sign-up", data);
        if (!res.data.success) {
            throw new Error(res.data.error || "Sign up failed");
        }
        return res.data.data;
    },

    refreshToken: async (data: RefreshTokenRequestDTO): Promise<RefreshTokenResponseDTO> => {
        const res = await axios.post<ApiResponse<RefreshTokenResponseDTO>>("/auth/refresh-token", data);
        if (!res.data.success) {
            throw new Error(res.data.error || "Refresh token failed");
        }
        return res.data.data;
    },

    logout: async (refreshToken: string): Promise<void> => {
        await axios.post<ApiResponse<void>>("/auth/logout", { refreshToken });
    },

    getCurrentRole: async (): Promise<CurrentRoleDTO> => {
        const res = await axios.get<ApiResponse<CurrentRoleDTO>>("/roles/me");
        if (!res.data.success) {
            throw new Error(res.data.error || "Failed to load role");
        }
        return res.data.data;
    }
}
