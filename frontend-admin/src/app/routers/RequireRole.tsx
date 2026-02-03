import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks";

interface RequireRoleProps {
    allowedPermissions?: string[];
    children?: React.ReactNode;
}

export const RequireRole = ({ allowedPermissions = [], children }: RequireRoleProps) => {
    const { isAuthenticated, isLoading, hasPermission } = useAuth();

    // Hiển thị loading spinner hoặc đợi khi đang khởi tạo auth
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

    const isAllowed = allowedPermissions.length === 0 ? true : hasPermission(allowedPermissions);

    if (!isAllowed) {
        // Chuyển hướng về trang báo lỗi không có quyền
        return <Navigate to="/forbidden" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
