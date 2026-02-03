import React, { useState } from "react";
import { useUser } from "../hooks/useUser";
import {
    FaUser,
    FaXmark
} from "react-icons/fa6";
import { userService } from "../services/user.service";
import { normalizeProfileForm, validateProfileField, validateProfileForm, type ProfileFormErrors } from "../utils/profileValidation";

const UserProfilePage: React.FC = () => {
    const { user, loading, refreshUser } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<ProfileFormErrors>({});

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        gender: "OTHER",
        dateOfBirth: ""
    });

    React.useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || "",
                phoneNumber: user.phoneNumber || "",
                gender: user.gender || "OTHER",
                dateOfBirth: user.dateOfBirth || ""
            });
        }
    }, [user]);

    const openEditor = () => {
        setFormErrorMessage(null);
        setFieldErrors({});
        setIsEditing(true);
    };

    const closeEditor = () => {
        setIsEditing(false);
        setFormErrorMessage(null);
        setFieldErrors({});
    };

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setFieldErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const validateAndSetErrors = () => {
        const errors = validateProfileForm(formData);
        setFieldErrors(errors);
        return errors;
    };

    if (loading && !user) {
        return (
            <div className="p-8 space-y-6 animate-pulse">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto"></div>
                <div className="space-y-3 max-w-xl mx-auto">
                    {[1, 2, 3, 4].map(n => (
                        <div key={n} className="h-10 bg-gray-50 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!user) return null;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrorMessage(null);
        const errors = validateAndSetErrors();
        if (Object.keys(errors).length > 0) {
            return;
        }

        setSubmitting(true);
        try {
            await userService.updateProfile(normalizeProfileForm(formData));
            await refreshUser();
            setIsEditing(false);
        } catch (error) {
            console.error("Update failed", error);
            setFormErrorMessage((error as Error).message || "Không thể cập nhật thông tin.");
        } finally {
            setSubmitting(false);
        }
    };

    const ProfileField = ({ label, value }: { label: string, value?: string }) => (
        <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
            <span className="text-gray-500 font-bold text-[14px]">{label}</span>
            {value ? (
                <span className={`font-black text-[#001737] text-[14px] ${label === 'Họ và tên' ? 'uppercase' : ''}`}>
                    {value}
                </span>
            ) : (
                <button
                    onClick={openEditor}
                    className="text-emerald-600 font-black text-[14px] hover:underline transition-all"
                >
                    Thêm thông tin
                </button>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-8 md:p-10 flex flex-col items-center">
                {/* Avatar Section */}
                <div className="mb-8 relative group">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 relative z-10 overflow-hidden">
                        <FaUser className="text-4xl opacity-90" />
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="w-full max-w-xl mx-auto">
                    <div className="space-y-0 text-primary">
                        <ProfileField label="Họ và tên" value={user.fullName} />
                        <ProfileField label="Số điện thoại" value={user.phoneNumber} />
                        <ProfileField label="Email" value={user.email} />
                        <ProfileField
                            label="Giới tính"
                            value={user.gender === "MALE" ? "Nam" : user.gender === "FEMALE" ? "Nữ" : undefined}
                        />
                        <ProfileField label="Ngày sinh" value={user.dateOfBirth} />

                    </div>

                    <div className="mt-10 flex justify-center">
                        <button
                            onClick={openEditor}
                            className="px-8 py-3.5 bg-emerald-50 text-emerald-700 font-black rounded-full hover:bg-emerald-100 transition-all active:scale-95 shadow-sm border border-emerald-100/50 text-[14px]"
                        >
                            Chỉnh sửa thông tin
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal Contextual */}
            {isEditing && (
                <div className="absolute inset-0 z-50 bg-white p-8 transition-all duration-300 overflow-y-auto">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-[#001737]">Chỉnh sửa thông tin</h2>
                            <button
                                onClick={closeEditor}
                                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                            >
                                <FaXmark className="text-base" />
                            </button>
                        </div>

                        {formErrorMessage && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {formErrorMessage}
                            </div>
                        )}

                        <form onSubmit={handleUpdate} className="space-y-5">
                        <div className="space-y-1.5">
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-wider pl-1">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={e => updateField("fullName", e.target.value)}
                                        onBlur={() => setFieldErrors((prev) => ({
                                            ...prev,
                                            fullName: validateProfileField("fullName", formData),
                                        }))}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-[#001737] text-sm"
                                    />
                                    {fieldErrors.fullName && (
                                        <p className="text-xs font-semibold text-red-600 pl-1">{fieldErrors.fullName}</p>
                                    )}
                        </div>

                        <div className="space-y-1.5">
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-wider pl-1">Số điện thoại</label>
                                    <input
                                        type="text"
                                        value={formData.phoneNumber}
                                        onChange={e => updateField("phoneNumber", e.target.value)}
                                        onBlur={() => setFieldErrors((prev) => ({
                                            ...prev,
                                            phoneNumber: validateProfileField("phoneNumber", formData),
                                        }))}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-[#001737] text-sm"
                                    />
                                    {fieldErrors.phoneNumber && (
                                        <p className="text-xs font-semibold text-red-600 pl-1">{fieldErrors.phoneNumber}</p>
                                    )}
                        </div>

                            <div className="space-y-1.5 opacity-60">
                                <label className="text-[12px] font-black text-gray-400 uppercase tracking-wider pl-1">Email (Không thể thay đổi)</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    readOnly
                                    className="w-full px-5 py-3.5 bg-gray-100 border border-gray-100 rounded-xl cursor-not-allowed font-bold text-[#001737] text-sm"
                                />
                            </div>


                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-wider pl-1">Giới tính</label>
                                    <select
                                        value={formData.gender}
                                        onChange={e => updateField("gender", e.target.value)}
                                        onBlur={() => setFieldErrors((prev) => ({
                                            ...prev,
                                            gender: validateProfileField("gender", formData),
                                        }))}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-[#001737] appearance-none text-sm"
                                    >
                                        <option value="MALE">Nam</option>
                                        <option value="FEMALE">Nữ</option>
                                        <option value="OTHER">Khác</option>
                                    </select>
                                    {fieldErrors.gender && (
                                        <p className="text-xs font-semibold text-red-600 pl-1">{fieldErrors.gender}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-wider pl-1">Ngày sinh</label>
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={e => updateField("dateOfBirth", e.target.value)}
                                        onBlur={() => setFieldErrors((prev) => ({
                                            ...prev,
                                            dateOfBirth: validateProfileField("dateOfBirth", formData),
                                        }))}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-[#001737] text-sm"
                                    />
                                    {fieldErrors.dateOfBirth && (
                                        <p className="text-xs font-semibold text-red-600 pl-1">{fieldErrors.dateOfBirth}</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={closeEditor}
                                className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-black rounded-xl hover:bg-gray-200 transition-all active:scale-95 text-sm"
                            >
                                Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3.5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 text-sm"
                                >
                                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfilePage;
