export interface UserProfileResponse {
    userId: string;
    email: string;
    avatarUrl?: string | null;
    biography?: string | null;
    fullName: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
}
