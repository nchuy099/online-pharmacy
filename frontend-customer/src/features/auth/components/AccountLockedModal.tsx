import React, { useEffect } from "react";
import { FaShieldAlt } from "react-icons/fa";
import { useAuthContext } from "../context/AuthContext";

export const AccountLockedModal: React.FC = () => {
    const { isAccountLockedModalOpen, closeAccountLockedModal } = useAuthContext();

    useEffect(() => {
        document.body.style.overflow = isAccountLockedModalOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isAccountLockedModalOpen]);

    if (!isAccountLockedModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#001737]/55" />
            <div className="relative w-full max-w-md rounded-[28px] bg-white shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                        <FaShieldAlt className="text-2xl" />
                    </div>
                    <h2 className="text-2xl font-black text-[#001737] mb-3">Tài khoản đã bị khóa</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Tài khoản của bạn hiện không thể đăng nhập hoặc sử dụng hệ thống.
                        Vui lòng liên hệ bộ phận hỗ trợ để được kiểm tra và mở khóa.
                    </p>

                    <button
                        onClick={closeAccountLockedModal}
                        className="mt-6 w-full py-3.5 rounded-2xl bg-[#001737] text-white font-bold hover:bg-emerald-600 transition-colors"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};
