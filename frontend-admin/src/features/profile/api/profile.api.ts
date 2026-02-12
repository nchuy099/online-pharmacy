import axiosInstance from '../../../shared/services/axios';
import type { PasswordChangeData } from '../types/domain';

interface AvatarUploadUrlResponse {
    uploadUrl: string;
    fileUrl: string;
}

export const profileApi = {
    changePassword: async (data: PasswordChangeData): Promise<void> => {
        await axiosInstance.put('/users/me/change-password', {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
        });
    },

    createAvatarUploadUrl: async (): Promise<any> => {
        const response = await axiosInstance.post('/users/me/avatar/upload-url/create');
        return response.data;
    },

    updateProfile: async (data: any): Promise<any> => {
        const response = await axiosInstance.put('/users/me/update', data);
        return response.data;
    }
};

export type { AvatarUploadUrlResponse };
