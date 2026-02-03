import React from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import { useHealthProfile } from "@/features/chat/hooks/useHealthProfile";
import { HealthProfileForm } from "../components/HealthProfileForm";

const HealthProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { profile, loading, saving, saved, updateField: handleChange, saveProfile: handleSave } = useHealthProfile();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-emerald-600 font-black uppercase tracking-widest text-xs">Đang tải hồ sơ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/me")}
                    className="flex items-center gap-2 text-emerald-600 font-black mb-8 hover:translate-x-[-4px] transition-transform uppercase tracking-wider text-sm"
                >
                    <FaChevronLeft /> Quay lại hồ sơ của tôi
                </button>

                {/* Title */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">Hồ sơ sức khỏe</h1>
                    <p className="text-gray-400 font-medium mt-2">Thông tin giúp dược sĩ tư vấn chính xác hơn cho bạn.</p>
                </div>

                <HealthProfileForm
                    profile={profile}
                    saving={saving}
                    saved={saved}
                    onChange={handleChange}
                    onSave={handleSave}
                />
            </div>
        </div>
    );
};

export default HealthProfilePage;
