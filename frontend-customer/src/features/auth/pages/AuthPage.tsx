import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthHeader } from "../components/AuthHeader";
import { AuthForm } from "../components/AuthForm";

const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [authType, setAuthType] = useState<"login" | "signup">("login");

    const oauthError = useMemo(() => {
        const error = searchParams.get("error");
        if (!error) return "";
        if (error === "oauth2_cancelled") return "Bạn đã hủy đăng nhập Facebook.";
        if (error === "invalid_role") return "Tài khoản này không có quyền đăng nhập vào trang khách hàng.";
        if (error === "oauth2_failed") return "Đăng nhập Facebook không thành công.";
        if (error === "tokens_missing") return "Không lấy được thông tin đăng nhập.";
        return "Đăng nhập không thành công.";
    }, [searchParams]);

    const toggleAuthType = () => {
        setAuthType((prev) => (prev === "login" ? "signup" : "login"));
    };

    const handleSignUpSuccess = () => {
        setAuthType("login");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
            <div className="relative w-full max-w-md">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    aria-label="Về trang chủ"
                    className="absolute left-0 top-0 inline-flex h-10 w-10 -translate-y-2 -translate-x-2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <AuthHeader type={authType} />
                {oauthError && (
                    <div className="mt-4 mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium">
                        {oauthError}
                    </div>
                )}
                <AuthForm 
                    key={authType} 
                    type={authType} 
                    onSuccess={authType === "signup" ? handleSignUpSuccess : () => navigate("/")} 
                />

                <div className="mt-8 text-center">
                    <p className="text-gray-600">
                        {authType === "login"
                            ? "Chưa có tài khoản?"
                            : "Đã có tài khoản rồi?"}{" "}
                        <button
                            onClick={toggleAuthType}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                        >
                            {authType === "login" ? "Đăng ký ngay" : "Đăng nhập ngay"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
