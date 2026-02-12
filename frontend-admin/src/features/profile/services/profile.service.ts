import { profileApi, AvatarUploadUrlResponse } from '../api/profile.api';
import type { PasswordChangeData } from '../types/domain';

const resolveAvatarUploadPayload = (raw: any): AvatarUploadUrlResponse => {
    const payload = raw?.data?.data ?? raw?.data ?? raw?.result ?? raw;
    if (!payload?.uploadUrl || !payload?.fileUrl) {
        throw new Error('Create avatar upload URL failed');
    }
    return payload as AvatarUploadUrlResponse;
};

export const profileService = {
    changePassword: async (data: PasswordChangeData): Promise<void> => {
        await profileApi.changePassword(data);
    },

    uploadAvatar: async (file: File): Promise<string> => {
        const raw = await profileApi.createAvatarUploadUrl();
        const payload = resolveAvatarUploadPayload(raw);

        const response = await fetch(payload.uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type,
            },
            body: file,
        });

        if (!response.ok) {
            const responseText = await response.text().catch(() => '');
            console.error('[S3 Upload][Avatar] Forbidden/Failed response', {
                status: response.status,
                statusText: response.statusText,
                uploadUrl: payload.uploadUrl,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                responseText,
            });

            throw new Error('Upload avatar to S3 failed (' + response.status + ' ' + response.statusText + ')');
        }

        return payload.fileUrl;
    },

    updateProfile: async (data: any): Promise<any> => {
        return await profileApi.updateProfile(data);
    }
};
