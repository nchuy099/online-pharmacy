export interface LoginRequestDTO {
    identifier: string;
    password: string;
}

export interface UserDTO {
    id: string;
    email: string;
    fullName: string;
}

export interface LoginResponseDTO {
    user: UserDTO;
    accessToken: string;
    refreshToken: string;
}

export interface SignUpRequestDTO {
    email: string;
    fullName: string;
    password: string;
}

export interface RefreshTokenRequestDTO {
    refreshToken: string;
}

export interface RefreshTokenResponseDTO {
    accessToken: string;
    refreshToken: string;
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

export interface CurrentRoleDTO {
    roleType?: string;
}
