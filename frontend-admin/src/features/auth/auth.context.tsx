import { createContext, useEffect, useState } from "react";
import { User } from "../user/types/domain";
import { API_SUCCESS_CODE } from "../../shared/constants/api";
import { jwtDecode } from "jwt-decode";
import authService from "./services";
import { normalizeRole } from "./utils/role";
import { normalizePermissions } from "./utils/permission";
import { AUTH_USER_LOCKED_EVENT } from "./auth.constants";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    hasRole: (roles: string | string[]) => boolean;
    hasPermission: (permissions: string | string[]) => boolean;
    isAccountLockedModalOpen: boolean;
    closeAccountLockedModal: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialAuthState = {
    user: null,
    isAuthenticated: false
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(initialAuthState.user);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuthState.isAuthenticated);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAccountLockedModalOpen, setIsAccountLockedModalOpen] = useState(false);

    const matchesAny = (current: string | string[] | undefined, values: string | string[]) => {
        const currentList = Array.isArray(current) ? current : current ? [current] : [];
        const targetList = Array.isArray(values) ? values : [values];
        return targetList.filter(Boolean).some((value) => currentList.includes(value));
    };

    const clearSession = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
    };

    const closeAccountLockedModal = () => setIsAccountLockedModalOpen(false);

    const hydrateStoredUser = async (storedUser: string) => {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role) {
            parsedUser.role = normalizeRole(parsedUser.role);
        }
        parsedUser.permissions = normalizePermissions(parsedUser.permissions);

        const hydratedUser = await authService.loadCurrentAccess(parsedUser);
        setUser(hydratedUser);
        localStorage.setItem("user", JSON.stringify(hydratedUser));
    };

    const initAuth = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");

            if (!accessToken || !refreshToken) {
                clearSession();
                return;
            }

            const { exp } = jwtDecode<{ exp: number }>(accessToken);
            const expired = Date.now() >= exp * 1000;

            if (expired) {
                const res = await authService.refreshToken(refreshToken);
                if (res.code === API_SUCCESS_CODE && res.data?.accessToken) {
                    localStorage.setItem("accessToken", res.data.accessToken);
                    setIsAuthenticated(true);
                    const storedUser = localStorage.getItem("user");
                    if (storedUser) {
                        await hydrateStoredUser(storedUser);
                    }
                } else {
                    throw new Error("Refresh Failed");
                }
            } else {
                setIsAuthenticated(true);
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    await hydrateStoredUser(storedUser);
                }
            }
        } catch (err) {
            clearSession();
            console.error("Auth initialization failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const user = await authService.login({ identifier: email, password });
            setIsAuthenticated(true);
            setUser(user);
        } catch (error) {
            console.error('Login error:', error);
            clearSession();
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsAccountLockedModalOpen(false);
            clearSession();
        }
    };

    const hasRole = (roles: string | string[]) => {
        if (!user?.role) return false;
        return matchesAny(normalizeRole(user.role), Array.isArray(roles) ? roles.map((role) => normalizeRole(role)) : normalizeRole(roles));
    };

    const hasPermission = (permissions: string | string[]) => {
        if (!user?.permissions?.length) return false;
        return matchesAny(user.permissions, Array.isArray(permissions) ? permissions : [permissions]);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasRole,
        hasPermission,
        isAccountLockedModalOpen,
        closeAccountLockedModal
    };

    useEffect(() => {
        const handleUserLocked = () => {
            setIsAccountLockedModalOpen(true);
            clearSession();
        };

        window.addEventListener(AUTH_USER_LOCKED_EVENT, handleUserLocked as EventListener);
        initAuth();

        return () => {
            window.removeEventListener(AUTH_USER_LOCKED_EVENT, handleUserLocked as EventListener);
        };
    }, []);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
