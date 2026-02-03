import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks";
import { canEnterAdmin } from "../../features/auth/utils/adminAccess";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    console.log("isAuthenticated: ", isAuthenticated, "isLoading: ", isLoading);

    // Hiển thị loading spinner hoặc đợi khi đang khởi tạo auth
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (!canEnterAdmin(user?.permissions)) {
        return <Navigate to="/forbidden" replace />;
    }
    return children;
};
