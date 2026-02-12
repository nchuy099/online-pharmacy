import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

export const DefaultRoute = () => {
    const { user } = useAuth();
    const roleType = user?.roleType?.trim().toUpperCase();
    const role = user?.role?.trim().toUpperCase();

    if (roleType === 'PHARMACIST' || role === 'PHARMACIST') {
        return <Navigate to="/chat-dashboard" replace />;
    }

    return <Navigate to="/forbidden" replace />;
};
