import axiosInstance from '../../../shared/api/axiosInstance';
import type { LoginParamsDTO, AuthResponseDTO, CurrentAccessDTO } from '../types/dto';

export const authApi = {
    login: async (params: LoginParamsDTO): Promise<AuthResponseDTO> => {
        const res = await axiosInstance.post<{ data: AuthResponseDTO }>('/auth/login', params);
        return res.data.data;
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponseDTO> => {
        const res = await axiosInstance.post<{ data: AuthResponseDTO }>('/auth/refresh-token', { refreshToken });
        return res.data.data;
    },

    getPharmacistProfile: async (accessToken: string): Promise<{ isApproved?: boolean }> => {
        const res = await axiosInstance.get<{ data: { isApproved?: boolean } }>('/pharmacists/me/details', {
            headers: {
                Authorization: 'Bearer ' + accessToken,
            },
        });
        return res.data.data;
    },

    getCurrentAccess: async (): Promise<CurrentAccessDTO> => {
        const res = await axiosInstance.get<{ data: CurrentAccessDTO }>('/admin/roles/me');
        return res.data.data;
    },
};
