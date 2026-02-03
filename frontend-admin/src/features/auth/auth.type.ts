import { User } from '../user/types/domain';

export interface LoginPayload {
    identifier: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface CurrentAccessResponse {
    id: string;
    name: string;
    description?: string;
    roleType?: string;
    protectedRole?: boolean;
    permissions: Array<{
        id: string;
        name: string;
        description?: string;
        roleType?: string;
        critical?: boolean;
        assignable?: boolean;
    }>;
}

export interface RefreshTokenPayload {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
}
