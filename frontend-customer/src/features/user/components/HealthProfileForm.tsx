import React from "react";
import { FaUser, FaNotesMedical, FaRunning, FaSave, FaCheckCircle, FaWeight, FaRulerVertical, FaBirthdayCake, FaVenusMars, FaAllergies, FaPills, FaHeartbeat, FaSmoking, FaWineGlassAlt } from "react-icons/fa";
import type { HealthProfile } from "@/features/chat/types/domain";

interface Props {
    profile: HealthProfile;
    saving: boolean;
    saved: boolean;
    onChange: (field: keyof HealthProfile, value: string | number | null) => void;
    onSave: () => void;
}

export const HealthProfileForm: React.FC<Props> = ({ profile, saving, saved, onChange, onSave }) => {
    return (
        <div className="space-y-8">
            {/* ─── SECTION 1: BASIC INFO ─── */}
            <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-emerald-50/30">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <FaUser className="text-emerald-600" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Thông tin cơ bản</h2>
                </div>
                <div className="p-8 space-y-6">
                    {/* Full Name */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                            <FaUser className="text-emerald-400" /> Họ và tên
                        </label>
                        <input
                            type="text"
                            value={profile.fullName}
                            onChange={e => onChange("fullName", e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Year of Birth */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                <FaBirthdayCake className="text-emerald-400" /> Năm sinh
                            </label>
                            <input
                                type="number"
                                value={profile.yearOfBirth ?? ""}
                                onChange={e => onChange("yearOfBirth", e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="1990"
                                min={1900}
                                max={new Date().getFullYear()}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                            />
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                <FaVenusMars className="text-emerald-400" /> Giới tính
                            </label>
                            <select
                                value={profile.gender}
                                onChange={e => onChange("gender", e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all appearance-none"
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Weight */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                <FaWeight className="text-emerald-400" /> Cân nặng (kg)
                            </label>
                            <input
                                type="number"
                                value={profile.weight ?? ""}
                                onChange={e => onChange("weight", e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="60"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                            />
                        </div>

                        {/* Height */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                <FaRulerVertical className="text-emerald-400" /> Chiều cao (cm)
                            </label>
                            <input
                                type="number"
                                value={profile.height ?? ""}
                                onChange={e => onChange("height", e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="170"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── SECTION 2: MEDICAL HISTORY ─── */}
            <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-rose-50/30">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                        <FaNotesMedical className="text-rose-500" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Tiền sử y tế</h2>
                </div>
                <div className="p-8 space-y-6">
                    {/* Underlying Diseases */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                            <FaHeartbeat className="text-rose-400" /> Bệnh nền
                        </label>
                        <textarea
                            value={profile.underlyingDiseases}
                            onChange={e => onChange("underlyingDiseases", e.target.value)}
                            placeholder="VD: Tiểu đường, Cao huyết áp, Hen suyễn..."
                            rows={3}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 transition-all resize-none"
                        />
                    </div>

                    {/* Drug Allergies */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                            <FaAllergies className="text-rose-400" /> Dị ứng thuốc
                        </label>
                        <textarea
                            value={profile.drugAllergies}
                            onChange={e => onChange("drugAllergies", e.target.value)}
                            placeholder="VD: Penicillin, Aspirin, Sulfonamid..."
                            rows={3}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 transition-all resize-none"
                        />
                    </div>

                    {/* Current Medications */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                            <FaPills className="text-rose-400" /> Đang dùng thuốc gì
                        </label>
                        <textarea
                            value={profile.currentMedications}
                            onChange={e => onChange("currentMedications", e.target.value)}
                            placeholder="VD: Metformin 500mg 2 viên/ngày, Amlodipine 5mg 1 viên/ngày..."
                            rows={3}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 transition-all resize-none"
                        />
                    </div>
                </div>
            </section>

            {/* ─── SECTION 3: LIFESTYLE ─── */}
            <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-amber-50/30">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <FaRunning className="text-amber-600" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Thói quen / Lối sống</h2>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Smoking */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                <FaSmoking className="text-amber-500" /> Hút thuốc
                            </label>
                            <select
                                value={profile.smoking}
                                onChange={e => onChange("smoking", e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all appearance-none"
                            >
                                <option value="">Chọn mức độ</option>
                                <option value="NONE">Không hút</option>
                                <option value="SOMETIMES">Thỉnh thoảng</option>
                                <option value="OFTEN">Thường xuyên</option>
                            </select>
                        </div>

                        {/* Alcohol */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                <FaWineGlassAlt className="text-amber-500" /> Rượu bia
                            </label>
                            <select
                                value={profile.alcohol}
                                onChange={e => onChange("alcohol", e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all appearance-none"
                            >
                                <option value="">Chọn mức độ</option>
                                <option value="NONE">Không uống</option>
                                <option value="SOMETIMES">Thỉnh thoảng</option>
                                <option value="OFTEN">Thường xuyên</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── SAVE BUTTON ─── */}
            <div className="pt-2 pb-8">
                <button
                    onClick={onSave}
                    disabled={saving}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-3 transition-all ${saved
                        ? "bg-emerald-50 text-emerald-600 border-2 border-emerald-200"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-200/40 hover:shadow-emerald-300/60 hover:scale-[1.01] active:scale-[0.99]"
                        } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Đang lưu...
                        </>
                    ) : saved ? (
                        <>
                            <FaCheckCircle /> Đã lưu thành công!
                        </>
                    ) : (
                        <>
                            <FaSave /> Lưu thông tin
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
