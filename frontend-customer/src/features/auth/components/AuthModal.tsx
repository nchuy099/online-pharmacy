import React, { useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import { useAuthContext } from "../context/AuthContext";
import { AuthForm } from "./AuthForm";
import { AuthHeader } from "./AuthHeader";

export const AuthModal: React.FC = () => {
    const { isAuthModalOpen, closeAuthModal } = useAuthContext();
    const [authType, setAuthType] = React.useState<"login" | "signup">("login");

    // Reset authType to login when modal opens
    useEffect(() => {
        if (isAuthModalOpen) {
            setAuthType("login");
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isAuthModalOpen]);

    if (!isAuthModalOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            closeAuthModal();
        }
    };

    const toggleAuthType = () => {
        setAuthType((prev) => (prev === "login" ? "signup" : "login"));
    };

    const handleSignUpSuccess = () => {
        setAuthType("login");
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#001737]/40 animate-in fade-in duration-300" />

            {/* Modal Content */}
            <div className="relative w-full max-w-[400px] bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Close Button */}
                <button
                    onClick={closeAuthModal}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                    <FaXmark className="text-base" />
                </button>

                <div className="p-5 md:p-6">
                    <div className="mb-0">
                        <AuthHeader type={authType} />
                    </div>
                    
                    <AuthForm 
                        key={authType}
                        type={authType} 
                        onSuccess={authType === "signup" ? handleSignUpSuccess : closeAuthModal} 
                    />

                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-[13px]">
                            {authType === "login"
                                ? "Chưa có tài khoản?"
                                : "Đã có tài khoản?"}{" "}
                            <button
                                onClick={toggleAuthType}
                                className="text-emerald-600 hover:text-emerald-700 font-black transition-colors"
                            >
                                {authType === "login" ? "Đăng ký ngay" : "Đăng nhập ngay"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
