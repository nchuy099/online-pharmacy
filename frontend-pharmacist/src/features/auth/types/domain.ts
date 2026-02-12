export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'PHARMACIST' | 'USER';
    name?: string;
    avatar?: string;
    isApproved?: boolean;
    roleType?: string;
    roleLevel?: number;
    roleProtected?: boolean;
    permissions?: string[];
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, refreshToken: string, user: User) => Promise<void>;
    logout: () => void;
    hasPermission: (permissions: string | string[]) => boolean;
    isAccountLockedModalOpen?: boolean;
    closeAccountLockedModal?: () => void;
}
