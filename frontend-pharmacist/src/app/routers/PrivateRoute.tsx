import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

const ALLOWED_ROLES = new Set(['PHARMACIST']);

export const PrivateRoute = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const normalizedRoleType = user?.roleType?.trim().toUpperCase();
    const normalizedRole = user?.role?.trim().toUpperCase();
    const hasAllowedRole = ALLOWED_ROLES.has(normalizedRoleType || '') || ALLOWED_ROLES.has(normalizedRole || '');
    if (!hasAllowedRole) {
        return <Navigate to="/forbidden" replace />;
    }

    if (user?.isApproved === false) {
        return <Navigate to="/forbidden?reason=not-approved" replace />;
    }

    return <Outlet />;
};
