import { User } from '../../user/types/domain';

export interface LoginPayload {
    identifier: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RefreshTokenPayload {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
}
