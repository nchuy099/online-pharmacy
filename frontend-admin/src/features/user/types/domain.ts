export interface User {
    id: string;
    name: string;
    fullName?: string;
    dateOfBirth?: string; // ISO yyyy-MM-dd
    gender?: "male" | "female" | "other" | "MALE" | "FEMALE" | "OTHER";
    email: string;
    phone: string;
    phoneNumber?: string;
    role: string;
    roleType?: string;
    roleProtected?: boolean;
    roleDescription?: string;
    roles?: string[];
    permissions?: string[];
    status: string; // accept ACTIVE/INACTIVE/legacy
    joinDate: string;
    lastLogin: string;
    createdAt?: string;
    avatarUrl?: string;
    biography?: string;
}
