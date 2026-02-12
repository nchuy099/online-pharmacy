import { Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';

type RequirePermissionProps = {
    children: JSX.Element;
    allowedPermissions: string[];
};

export const RequirePermission = ({ children, allowedPermissions }: RequirePermissionProps) => {
    const { hasPermission } = useAuth();

    const permitted = allowedPermissions.some((permission) => hasPermission(permission));
    if (!permitted) {
        return <Navigate to="/forbidden" replace />;
    }

    return children;
};
