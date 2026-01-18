/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import type { User, AuthState } from "../types/domain";
import { authService } from "../services/auth.service";
import { AUTH_USER_LOCKED_EVENT } from "../auth.constants";

type AuthContextType = AuthState & {
    accessToken: string | null;
    refreshToken: string | null;
    loginSuccess: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    isAccountLockedModalOpen: boolean;
    openAccountLockedModal: () => void;
    closeAccountLockedModal: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const normalizePermissions = (permissions?: string[] | null) =>
    Array.from(new Set((permissions || []).map((permission) => permission.trim().toUpperCase()).filter(Boolean)));

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem("user");
        if (!savedUser || savedUser === "undefined") return null;
        try {
            const parsed = JSON.parse(savedUser) as User;
            return {
                ...parsed,
                permissions: normalizePermissions(parsed.permissions),
            };
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem("user");
            return null;
        }
    });

    const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem("accessToken"));
    const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem("refreshToken"));
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAccountLockedModalOpen, setIsAccountLockedModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);
    const openAccountLockedModal = () => setIsAccountLockedModalOpen(true);
    const closeAccountLockedModal = () => setIsAccountLockedModalOpen(false);

    const clearSession = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setIsAuthModalOpen(false);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    };

    useEffect(() => {
        const handleUserLocked = () => {
            openAccountLockedModal();
            clearSession();
        };

        window.addEventListener(AUTH_USER_LOCKED_EVENT, handleUserLocked as EventListener);
        return () => window.removeEventListener(AUTH_USER_LOCKED_EVENT, handleUserLocked as EventListener);
    }, []);

    const hydrateCurrentAccess = async (baseUser: User) => {
        try {
            const access = await authService.loadCurrentAccess(baseUser);
            const hydratedUser = {
                ...baseUser,
                ...access,
                permissions: normalizePermissions(access.permissions),
            };
            setUser(hydratedUser);
            localStorage.setItem("user", JSON.stringify(hydratedUser));
            return hydratedUser;
        } catch (error) {
            console.warn("Failed to hydrate current access", error);
            throw error;
        }
    };

    const loginSuccess = async (incomingUser: User, nextAccessToken: string, nextRefreshToken: string) => {
        const nextUser: User = { ...incomingUser };

        setAccessToken(nextAccessToken);
        setRefreshToken(nextRefreshToken);
        localStorage.setItem("accessToken", nextAccessToken);
        localStorage.setItem("refreshToken", nextRefreshToken);

        try {
            const hydratedUser = await hydrateCurrentAccess(nextUser);
            setUser(hydratedUser);
        } catch (error) {
            clearSession();
            throw error;
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedAccessToken = localStorage.getItem("accessToken");
                const storedRefreshToken = localStorage.getItem("refreshToken");
                const storedUser = localStorage.getItem("user");

                if (!storedAccessToken || !storedRefreshToken || !storedUser) {
                    clearSession();
                    setIsLoading(false);
                    return;
                }

                const parsedUser = JSON.parse(storedUser) as User;
                const normalizedUser = {
                    ...parsedUser,
                    permissions: normalizePermissions(parsedUser.permissions),
                };

                setAccessToken(storedAccessToken);
                setRefreshToken(storedRefreshToken);
                setUser(normalizedUser);
                await hydrateCurrentAccess(normalizedUser);
            } catch (error) {
                console.error("Failed to initialize auth", error);
                clearSession();
            } finally {
                setIsLoading(false);
            }
        };

        void initAuth();
    }, []);

    const logout = async () => {
        try {
            const token = refreshToken || localStorage.getItem("refreshToken");
            if (token) {
                await authService.logout(token);
            }
        } catch (err) {
            console.error("Logout API failed", err);
        } finally {
            setIsAccountLockedModalOpen(false);
            clearSession();
        }
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
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: Boolean(user && accessToken),
                isLoading,
                hasPermission,
                accessToken,
                refreshToken,
                loginSuccess,
                logout,
                isAuthModalOpen,
                openAuthModal,
                closeAuthModal,
                isAccountLockedModalOpen,
                openAccountLockedModal,
                closeAccountLockedModal
            }}
        >
            {children}
        </AuthContext.Provider>
    );

};

export const useAuthContext = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
    return ctx;
};
