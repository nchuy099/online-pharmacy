export interface PharmacistProfileDTO {
    id: string;
    userId: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    avatarUrl?: string;
    qualifications?: string;
    education?: string;
    experience?: string;
    specialtyCode?: string;
    specialtyName?: string;
    isApproved?: boolean;
    activeSessions: number;
    rating?: number;
    totalConsultations?: number;
    profit?: number;
    createdAt?: string;
}

export interface ProfileUpdateParamsDTO {
    qualifications?: string;
    education?: string;
    experience?: string;
    specialtyCode?: string;
}

export interface PasswordChangeParamsDTO {
    currentPassword: string;
    newPassword: string;
}
