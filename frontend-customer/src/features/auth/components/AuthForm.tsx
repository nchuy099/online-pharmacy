import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface AuthFormProps {
    type: "login" | "signup";
    onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ type, onSuccess }) => {
    const isLogin = type === "login";
    const { loginUser, signUpUser, loading, error } = useAuth();
    const backendBaseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? "")
        .replace(/\/$/, "");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [emailError, setEmailError] = useState("");
    const [fullNameError, setFullNameError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const validateEmail = (value: string) => {
        if (!value) {
            setEmailError("Email không được để trống");
            return false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setEmailError("Email không hợp lệ");
            return false;
        } else {
            setEmailError("");
            return true;
        }
    };

    const validatePassword = (value: string) => {
        if (!value) {
            setPasswordError("Mật khẩu không được để trống");
            return false;
        }

        setPasswordError("");
        return true;
    };

    const validateFullName = (value: string) => {
        if (!value) {
            setFullNameError("Họ và tên không được để trống");
            return false;
        }

        setFullNameError("");
        return true;
    };

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isFullNameValid = isLogin ? true : validateFullName(fullName);

        if (isLogin) {
            if (!isEmailValid || !isPasswordValid) return;
            const success = await loginUser({ identifier: email, password });
            if (success && onSuccess) {
                onSuccess();
            }
        } else {
            if (!isFullNameValid || !isPasswordValid) return;

            if (!isEmailValid) return;
            const success = await signUpUser({ email, password, fullName });
            if (success && onSuccess) {
                onSuccess();
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl p-0 shadow-none border-none">
            {/* Error Alert */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
                    <p className="text-base text-red-700">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="space-y-2.5">
                {!isLogin && (
                    <div className="space-y-1">
                        <label className="text-[12px] font-black text-[#001737]/60 uppercase tracking-wider ml-1">
                            Họ và tên
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => {
                                setFullName(e.target.value);
                                if (fullNameError) setFullNameError("");
                            }}
                            placeholder="Nguyễn Văn A"
                            disabled={loading}
                            className="
                                w-full px-4 py-2 rounded-xl
                                border border-gray-100
                                bg-gray-50/50
                                text-gray-900 placeholder:text-gray-400
                                focus:outline-none
                                focus:ring-2 focus:ring-emerald-500/10
                                focus:border-emerald-500 focus:bg-white
                                transition-all duration-200
                                disabled:opacity-60 disabled:cursor-not-allowed
                                text-sm
                            "
                        />
                        {fullNameError && (
                            <p className="text-[11px] text-red-500 font-bold ml-1">{fullNameError}</p>
                        )}
                    </div>
                )}

                {/* Email */}
                <div className="space-y-1">
                    <label className="text-[12px] font-black text-[#001737]/60 uppercase tracking-wider ml-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError("");
                        }}
                        placeholder="email@example.com"
                        disabled={loading}
                        className="
                            w-full px-4 py-2 rounded-xl
                            border border-gray-100
                            bg-gray-50/50
                            text-gray-900 placeholder:text-gray-400
                            focus:outline-none
                            focus:ring-2 focus:ring-emerald-500/10
                            focus:border-emerald-500 focus:bg-white
                            transition-all duration-200
                            disabled:opacity-60 disabled:cursor-not-allowed
                            text-sm
                        "
                    />
                    {emailError && (
                        <p className="text-[11px] text-red-500 font-bold ml-1">{emailError}</p>
                    )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[12px] font-black text-[#001737]/60 uppercase tracking-wider">
                            Mật khẩu
                        </label>
                    </div>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError) setPasswordError("");
                        }}
                        placeholder="••••••••"
                        disabled={loading}
                        className="
                            w-full px-4 py-2 rounded-xl
                            border border-gray-100
                            bg-gray-50/50
                            text-gray-900 placeholder:text-gray-400
                            focus:outline-none
                            focus:ring-2 focus:ring-emerald-500/10
                            focus:border-emerald-500 focus:bg-white
                            transition-all duration-200
                            disabled:opacity-60 disabled:cursor-not-allowed
                            text-sm
                        "
                    />
                    {passwordError && (
                        <p className="text-[11px] text-red-500 font-bold ml-1">{passwordError}</p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="
                        w-full py-2.5 mt-1 rounded-xl
                        bg-emerald-600 hover:bg-emerald-700
                        text-white font-black text-sm
                        active:scale-[0.98]
                        disabled:opacity-60 disabled:cursor-not-allowed
                        transition-all duration-200
                        flex items-center justify-center gap-2
                        shadow-lg shadow-emerald-500/20
                    "
                >
                    {loading ? (
                        <>
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>{isLogin ? "Đang xử lý..." : "Đang tạo..."}</span>
                        </>
                    ) : (
                        <span>{isLogin ? "Đăng nhập" : "Đăng ký"}</span>
                    )}
                </button>
            </form>

            {isLogin && (
                <>
                    <div className="mt-6 mb-4 flex items-center gap-4">
                        <div className="h-px flex-1 bg-gray-100"></div>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                            Hoặc nhanh hơn
                        </span>
                        <div className="h-px flex-1 bg-gray-100"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.href = `${backendBaseUrl}/oauth2/authorization/google`}
                            disabled={loading}
                            className="
                                py-2 rounded-xl
                                border border-gray-100
                                bg-white hover:bg-gray-50
                                text-gray-900 font-bold text-sm
                                transition-all duration-200
                                flex items-center justify-center gap-2
                                shadow-sm
                                disabled:opacity-60 disabled:cursor-not-allowed
                            "
                        >
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="w-4 h-4"
                            />
                            <span>Google</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => window.location.href = `${backendBaseUrl}/oauth2/authorization/facebook`}
                            disabled={loading}
                            className="
                                py-2 rounded-xl
                                bg-[#1877F2] hover:bg-[#166fe5]
                                text-white font-bold text-sm
                                transition-all duration-200
                                flex items-center justify-center gap-2
                                shadow-md shadow-[#1877F2]/20
                                disabled:opacity-60 disabled:cursor-not-allowed
                            "
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>Facebook</span>
                        </button>
                    </div>
                </>
            )}

        </div>
    );
};
