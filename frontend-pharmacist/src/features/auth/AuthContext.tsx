import React, { createContext, useState, useEffect } from 'react';
import type { User, AuthState } from './types/domain';

import { authService } from './services/auth.service';
import { AUTH_USER_LOCKED_EVENT } from './auth.constants';
import { isUserLockedApiError } from '../../shared/api/apiError';

export const AuthContext = createContext<AuthState | undefined>(undefined);

const normalizePermissions = (permissions?: string[] | null) =>
    Array.from(new Set((permissions || []).map((permission) => permission.trim().toUpperCase()).filter(Boolean)));

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccountLockedModalOpen, setIsAccountLockedModalOpen] = useState(false);

    const clearSession = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const closeAccountLockedModal = () => setIsAccountLockedModalOpen(false);

    const hydrateCurrentAccess = async (baseUser: User) => {
        try {
            const access = await authService.loadCurrentAccess(baseUser);
            const hydratedUser = {
                ...baseUser,
                ...access,
                permissions: normalizePermissions(access.permissions),
            };
            setUser(hydratedUser);
            localStorage.setItem('user', JSON.stringify(hydratedUser));
            return hydratedUser;
        } catch (error) {
            console.warn('Failed to hydrate current access:', error);
            if (isUserLockedApiError(error)) {
                throw error;
            }
            return baseUser;
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            const storedUser = localStorage.getItem('user');
            if (!token || !storedUser) {
                clearSession();
                setIsLoading(false);
                return;
            }

            try {
                const parsedUser = JSON.parse(storedUser) as User;
                const baseUser = {
                    ...parsedUser,
                    permissions: normalizePermissions(parsedUser.permissions),
                };
                setUser(baseUser);
                setIsAuthenticated(true);
                await hydrateCurrentAccess(baseUser);
            } catch (err) {
                clearSession();
            }
            setIsLoading(false);
        };

        const handleUserLocked = () => {
            setIsAccountLockedModalOpen(true);
            clearSession();
        };

        window.addEventListener(AUTH_USER_LOCKED_EVENT, handleUserLocked as EventListener);
        void initAuth();
        return () => {
            window.removeEventListener(AUTH_USER_LOCKED_EVENT, handleUserLocked as EventListener);
        };
    }, []);

    const login = async (token: string, refreshToken: string, currentUser: User) => {
        const baseUser = {
            ...currentUser,
            permissions: normalizePermissions(currentUser.permissions),
        };
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(baseUser));
        setUser(baseUser);
        setIsAuthenticated(true);
        try {
            await hydrateCurrentAccess(baseUser);
        } catch (error) {
            clearSession();
            throw error;
        }
    };

    const logout = () => {
        setIsAccountLockedModalOpen(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const hasPermission = (permissions: string | string[]) => {
        if (!user?.permissions?.length) return false;
        const currentPermissions = new Set(normalizePermissions(user.permissions));
        const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
        return requiredPermissions
            .filter(Boolean)
            .map((permission) => permission.trim().toUpperCase())
            .some((permission) => currentPermissions.has(permission));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, hasPermission, isAccountLockedModalOpen, closeAccountLockedModal }}>
            {children}
        </AuthContext.Provider>
    );
};
