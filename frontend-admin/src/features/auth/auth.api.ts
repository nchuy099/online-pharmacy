import axios from '../../shared/services/axios';
import { ApiResponse } from '../../shared/types';
import { CurrentAccessResponse } from './auth.type';
import { LoginPayload, LoginResponse, RefreshTokenPayload, RefreshTokenResponse } from './auth.type';

const authApi = {
    async login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
        try {
            const res = await axios.post('/auth/login', payload);
            return res.data;
        } catch (error: any) {
            console.log('Login error: ', error);
            throw error;
        }
    },

    async refreshToken(payload: RefreshTokenPayload): Promise<ApiResponse<RefreshTokenResponse>> {
        try {
            const res = await axios.post('/auth/refresh-token', payload);
            return res.data;
        } catch (error: any) {
            console.log('Refresh token error: ', error);
            throw error;
        }
    },

    async logout(refreshToken: string): Promise<ApiResponse> {
        try {
            const res = await axios.post('/auth/logout', { refreshToken });
            return res.data;
        } catch (error: any) {
            console.log('Logout error: ', error);
            throw error;
        }
    },

    async getCurrentAccess(): Promise<ApiResponse<CurrentAccessResponse>> {
        try {
            const res = await axios.get('/admin/roles/me');
            return res.data;
        } catch (error: any) {
            console.log('Get current access error: ', error);
            throw error;
        }
    },
};

export default authApi;
