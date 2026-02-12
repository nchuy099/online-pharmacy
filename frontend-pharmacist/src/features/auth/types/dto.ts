export interface UserDTO {
    id: string;
    email: string;
    role: 'ADMIN' | 'PHARMACIST' | 'USER';
    fullName?: string;
    avatar?: string;
}

export interface AuthResponseDTO {
    accessToken: string;
    refreshToken: string;
    user: UserDTO;
}

export interface PermissionDTO {
    id: string;
    name: string;
    description?: string;
    roleType?: string;
    critical?: boolean;
    assignable?: boolean;
}

export interface CurrentAccessDTO {
    id: string;
    name: string;
    description?: string;
    roleType?: string;
    level?: number;
    protectedRole?: boolean;
    permissions: PermissionDTO[];
}

export interface LoginParamsDTO {
    identifier: string;
    password: string;
}
