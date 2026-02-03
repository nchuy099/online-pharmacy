import { User } from '../user/types/domain';
import { HTTP_STATUS } from '../../shared/constants';
import { API_SUCCESS_CODE } from '../../shared/constants/api';
import authApi from './auth.api';
import { ApiResponse } from '../../shared/types';
import { LoginPayload, RefreshTokenResponse } from './auth.type';
import { normalizePermissions } from './utils/permission';
import { normalizeRole } from './utils/role';
import { isUserLockedApiError } from '../../shared/services/apiError';

const hydrateAccess = async (user: User): Promise<User> => {
    try {
        const accessResponse = await authApi.getCurrentAccess();
        if (accessResponse.code === API_SUCCESS_CODE && accessResponse.data) {
            user.role = normalizeRole(accessResponse.data.name);
            user.permissions = normalizePermissions(accessResponse.data.permissions.map((permission) => permission.name));
        }
        return user;
    } catch (error) {
        if (isUserLockedApiError(error)) {
            throw error;
        }
        return user;
    }
};

const authService = {
    async login(payload: LoginPayload): Promise<User> {
        try {
            const response = await authApi.login(payload);
            if (response.code === API_SUCCESS_CODE && response.data) {
                const user = response.data.user;
                const hydratedUser = await hydrateAccess(user);
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(hydratedUser));
                return hydratedUser;
            }
            throw new Error(response.message || 'Invalid credentials');
        } catch (error) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            throw error;
        }
    },

    async loadCurrentAccess(user: User): Promise<User> {
        return hydrateAccess(user);
    },

    async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
        return authApi.refreshToken({ refreshToken });
    },

    async logout(): Promise<ApiResponse> {
        const refreshToken = localStorage.getItem('refreshToken');
        try {
            if (refreshToken) {
                return await authApi.logout(refreshToken);
            }
            return { code: API_SUCCESS_CODE, status: HTTP_STATUS.OK, message: 'Logged out locally', success: true };
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    },
};

export default authService;
