import { authApi } from '../api/auth.api';
import type { UserDTO, LoginParamsDTO } from '../types/dto';
import type { User } from '../types/domain';
import { isUserLockedApiError } from '../../../shared/api/apiError';
import { AUTH_USER_LOCKED_EVENT } from '../auth.constants';

const emitUserLocked = () => {
    window.dispatchEvent(new Event(AUTH_USER_LOCKED_EVENT));
};

const normalizePermissions = (permissions?: string[] | null) =>
    Array.from(new Set((permissions || []).map((permission) => permission.trim().toUpperCase()).filter(Boolean)));

const mapUserDTOToDomain = (dto: UserDTO): User => {
    return {
        id: dto.id,
        email: dto.email,
        role: dto.role,
        name: dto.fullName,
        avatar: dto.avatar,
    };
};

const applyCurrentAccess = async (user: User): Promise<User> => {
    try {
        const access = await authApi.getCurrentAccess();
        return {
            ...user,
            role: access.name as User['role'],
            roleType: access.roleType,
            roleLevel: access.level,
            roleProtected: access.protectedRole,
            permissions: normalizePermissions(access.permissions.map((permission) => permission.name)),
        };
    } catch (error) {
        console.warn('Failed to load current access:', error);
        if (isUserLockedApiError(error)) {
            emitUserLocked();
            throw error;
        }
        return user;
    }
};

export const authService = {
    login: async (params: LoginParamsDTO): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
        try {
            const data = await authApi.login(params);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            const user = mapUserDTOToDomain(data.user);
            const hydratedUser = await applyCurrentAccess(user);
            return {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                user: hydratedUser,
            };
        } catch (error) {
            if (isUserLockedApiError(error)) {
                emitUserLocked();
            }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            throw error;
        }
    },

    refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string; user: User }> => {
        try {
            const data = await authApi.refreshToken(refreshToken);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            const storedUser = localStorage.getItem('user');
            let fallbackUser: User | null = null;
            if (storedUser) {
                try {
                    fallbackUser = JSON.parse(storedUser) as User;
                } catch (error) {
                    console.warn('Failed to parse stored pharmacist user', error);
                }
            }
            const baseUser = fallbackUser || {
                id: "",
                email: "",
                role: "PHARMACIST" as const,
            };
            const hydratedUser = await applyCurrentAccess(baseUser);
            return {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                user: hydratedUser,
            };
        } catch (error) {
            if (isUserLockedApiError(error)) {
                emitUserLocked();
            }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            throw error;
        }
    },

    loadCurrentAccess: async (user: User): Promise<User> => {
        return applyCurrentAccess(user);
    }
};
