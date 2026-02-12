export interface PharmacistProfile {
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

export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

export interface ProfileUpdateData {
    qualifications?: string;
    education?: string;
    experience?: string;
    specialtyCode?: string;
}
