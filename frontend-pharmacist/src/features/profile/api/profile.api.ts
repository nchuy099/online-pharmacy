import axiosInstance from '../../../shared/api/axiosInstance';
import type { PharmacistProfileDTO, ProfileUpdateParamsDTO, PasswordChangeParamsDTO } from '../types/dto';

export const profileApi = {
    getProfile: async (): Promise<PharmacistProfileDTO> => {
        const res = await axiosInstance.get<{ data: PharmacistProfileDTO }>('/pharmacists/me/details');
        return res.data.data;
    },

    updateProfile: async (data: ProfileUpdateParamsDTO): Promise<PharmacistProfileDTO> => {
        const res = await axiosInstance.put<{ data: PharmacistProfileDTO }>('/pharmacists/me/pharmacist-profile', data);
        return res.data.data;
    },

    changePassword: async (data: PasswordChangeParamsDTO): Promise<void> => {
        await axiosInstance.put('/users/me/change-password', data);
    }
};
