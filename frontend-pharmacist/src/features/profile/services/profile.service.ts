import { profileApi } from '../api/profile.api';
import type { PharmacistProfileDTO, ProfileUpdateParamsDTO } from '../types/dto';
import type { PharmacistProfile, ProfileUpdateData, PasswordChangeData } from '../types/domain';

const mapProfileDTOToDomain = (dto: PharmacistProfileDTO): PharmacistProfile => ({
    id: dto.id,
    userId: dto.userId,
    email: dto.email,
    fullName: dto.fullName,
    phoneNumber: dto.phoneNumber,
    avatarUrl: dto.avatarUrl,
    qualifications: dto.qualifications,
    education: dto.education,
    experience: dto.experience,
    specialtyCode: dto.specialtyCode,
    specialtyName: dto.specialtyName,
    isApproved: dto.isApproved,
    activeSessions: dto.activeSessions,
    rating: dto.rating,
    totalConsultations: dto.totalConsultations,
    profit: dto.profit,
    createdAt: dto.createdAt,
});

export const profileService = {
    getProfile: async (): Promise<PharmacistProfile> => {
        const dto = await profileApi.getProfile();
        return mapProfileDTOToDomain(dto);
    },

    updateProfile: async (data: ProfileUpdateData): Promise<PharmacistProfile> => {
        const params: ProfileUpdateParamsDTO = {
            qualifications: data.qualifications,
            education: data.education,
            experience: data.experience,
            specialtyCode: data.specialtyCode,
        };

        const dto = await profileApi.updateProfile(params);
        return mapProfileDTOToDomain(dto);
    },

    changePassword: async (data: PasswordChangeData): Promise<void> => {
        await profileApi.changePassword({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
        });
    }
};
