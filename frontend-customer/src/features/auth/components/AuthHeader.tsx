import React from "react";

interface AuthHeaderProps {
    type: "login" | "signup";
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ type }) => {
    const isLogin = type === "login";

    return (
        <div className="text-center mb-4">
            <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
            </div>
            <h1 className="text-2xl font-black text-[#001737] mb-0.5">
                {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
                {isLogin
                    ? "Đăng nhập để tiếp tục trải nghiệm"
                    : "Tham gia cùng SmartPharma ngay"}
            </p>
        </div>
    );
};
