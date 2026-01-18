export interface User {
    id: string;
    email: string;
    fullName: string;
    role?: string;
    roleType?: string;
    roleLevel?: number;
    roleProtected?: boolean;
    permissions?: string[];
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasPermission: (permissions: string | string[]) => boolean;
    isAuthModalOpen?: boolean;
    openAuthModal?: () => void;
    closeAuthModal?: () => void;
    isAccountLockedModalOpen?: boolean;
    openAccountLockedModal?: () => void;
    closeAccountLockedModal?: () => void;
}
