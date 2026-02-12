import type { User } from "../../user/types/domain";

export type AdminProfile = User;

export interface ProfileUpdateData {
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth?: string;
    gender?: string;
    biography?: string;
    avatarUrl?: string;
}

export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
