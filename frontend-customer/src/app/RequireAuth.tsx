import { useAuthContext } from "@/features/auth/context/AuthContext";
import { useEffect } from "react";
import type { JSX } from "react";
import { Navigate } from "react-router-dom";

type RequireAuthProps = {
    children: JSX.Element;
};

const normalizeRole = (value?: string) => value?.trim().toUpperCase();

export const RequireAuth = ({ children }: RequireAuthProps) => {
    const { user, openAuthModal, isAccountLockedModalOpen } = useAuthContext();

    useEffect(() => {
        if (!user && !isAccountLockedModalOpen) {
            openAuthModal();
        }
    }, [user, openAuthModal, isAccountLockedModalOpen]);

    if (!user) {
        return <Navigate to={isAccountLockedModalOpen ? "/login" : "/"} replace />;
    }

    const roleType = normalizeRole(user.roleType);
    const role = normalizeRole(user.role);
    if (roleType !== "CUSTOMER" && role !== "CUSTOMER") {
        return <Navigate to="/forbidden" replace />;
    }

    return children;
};
