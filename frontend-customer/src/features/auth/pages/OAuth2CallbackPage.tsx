import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { userService } from "../../user/services/user.service";
import { CUSTOMER_LOGIN_ERROR_MESSAGE } from "../services/auth.service";

const OAuth2CallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginSuccess } = useAuthContext();

    useEffect(() => {
        const handleCallback = async () => {
            const accessToken = searchParams.get("accessToken");
            const refreshToken = searchParams.get("refreshToken");

            if (accessToken && refreshToken) {
                try {
                    // Set tokens temporarily in localStorage to allow getMe to work
                    localStorage.setItem("accessToken", accessToken);
                    localStorage.setItem("refreshToken", refreshToken);

                    // Fetch user info
                    const user = await userService.getCurrentUserProfile(accessToken);

                    // Complete login
                    await loginSuccess(user, accessToken, refreshToken);

                    // Redirect to home
                    navigate("/");
                } catch (error) {
                    console.error("OAuth2 callback processing failed", error);
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");

                    const message = error instanceof Error ? error.message : "";
                    if (message === CUSTOMER_LOGIN_ERROR_MESSAGE) {
                        navigate("/login?error=invalid_role");
                        return;
                    }

                    navigate("/login?error=oauth2_failed");
                }
            } else {
                console.error("Tokens missing in OAuth2 callback");
                navigate("/login?error=tokens_missing");
            }
        };

        handleCallback();
    }, [searchParams, loginSuccess, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900">Đang hoàn tất đăng nhập...</h2>
                <p className="text-gray-600 mt-2">Vui lòng chờ trong giây lát.</p>
            </div>
        </div>
    );
};

export default OAuth2CallbackPage;
