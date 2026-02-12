import React, { useEffect, useState } from 'react';
import { FaUserShield, FaIdCardAlt, FaEdit, FaCheckCircle, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ProfileInfo from '../components/ProfileInfo';
import AvatarUpload from '../components/AvatarUpload';
import PasswordChangeForm from '../components/PasswordChangeForm';
import ProfileEditForm from '../components/ProfileEditForm';
import { useAuth } from '../../auth/hooks';
import { profileService } from '../services/profile.service';
import toast from 'react-hot-toast';
import type { PasswordChangeData, ProfileUpdateData } from '../types/domain';
import { resolveApiErrorMessage } from '../../../shared/services/apiError';
import type { User } from '../../user/types/domain';

type Tab = 'GENERAL' | 'SECURITY';

const ProfilePage: React.FC = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('GENERAL');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAvatarUploading, setIsAvatarUploading] = useState(false);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | undefined>(undefined);
    const [profileUser, setProfileUser] = useState<User | null>(null);

    useEffect(() => {
        setCurrentAvatarUrl(user?.avatarUrl);
    }, [user?.avatarUrl]);

    useEffect(() => {
        setProfileUser(user ?? null);
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <FaSpinner className="animate-spin text-4xl text-emerald-500" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải hồ sơ...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <p className="text-red-500 font-bold uppercase tracking-widest text-xs">Không tìm thấy thông tin người dùng</p>
                <button onClick={() => navigate('/login')} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">Đăng nhập ngay</button>
            </div>
        );
    }

    const handleAvatarSelect = async (file: File) => {
        if (!isEditing) return;

        setIsAvatarUploading(true);
        try {
            const avatarUrl = await profileService.uploadAvatar(file);
            await profileService.updateProfile({ avatarUrl });
            setCurrentAvatarUrl(avatarUrl);
            setProfileUser((prev) => {
                if (!prev) return prev;
                const updated = { ...prev, avatarUrl };
                localStorage.setItem('user', JSON.stringify(updated));
                return updated;
            });

            toast.success('Cập nhật ảnh đại diện thành công!');
        } catch (error: any) {
            const message = resolveApiErrorMessage(error, 'Cập nhật ảnh đại diện thất bại.');
            toast.error(message);
        } finally {
            setIsAvatarUploading(false);
        }
    };

    const handleUpdateProfile = async (data: ProfileUpdateData) => {
        setIsSaving(true);
        try {
            const payload = {
                ...data,
                phoneNumber: data.phoneNumber?.trim(),
                fullName: data.fullName?.trim(),
                email: data.email?.trim(),
                biography: data.biography?.trim() || undefined,
                gender: data.gender || undefined,
                dateOfBirth: data.dateOfBirth || undefined,
            };

            await profileService.updateProfile(payload);

            const updatedUser: User = {
                ...(profileUser as User),
                fullName: payload.fullName,
                name: payload.fullName || profileUser?.name || '',
                email: payload.email,
                phoneNumber: payload.phoneNumber,
                phone: payload.phoneNumber,
                dateOfBirth: payload.dateOfBirth,
                gender: payload.gender as User['gender'],
                biography: payload.biography,
            };

            setProfileUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setIsEditing(false);
            toast.success('Cập nhật hồ sơ thành công!');
        } catch (error: any) {
            const message = resolveApiErrorMessage(error, 'Cập nhật hồ sơ thất bại.');
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (data: PasswordChangeData) => {
        setIsSaving(true);
        try {
            await profileService.changePassword(data);
            toast.success('Đổi mật khẩu thành công!');
            setActiveTab('GENERAL');
        } catch (error: any) {
            const message = resolveApiErrorMessage(error, 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-8 transition-all hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="h-40 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Quay lại
                    </button>
                </div>

                <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 relative z-10">
                    <div className="relative">
                        <AvatarUpload
                            currentImageUrl={currentAvatarUrl}
                            onImageSelect={handleAvatarSelect}
                            isEditing={isEditing && !isAvatarUploading}
                        />
                        {isAvatarUploading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center">
                                <FaSpinner className="animate-spin text-emerald-600 text-xl" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left pb-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{profileUser?.fullName || profileUser?.name}</h1>
                            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-[0.1em] shadow-sm">
                                <FaCheckCircle className="w-2.5 h-2.5" /> Hoạt động
                            </span>
                        </div>
                        <p className="text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] text-[11px] leading-none underline decoration-emerald-200 underline-offset-4">{profileUser?.role || 'Quản trị viên'}</p>
                    </div>

                    {!isEditing && activeTab === 'GENERAL' && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="mb-2 flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/25 group"
                        >
                            <FaEdit className="group-hover:rotate-12 transition-transform" /> Chỉnh sửa hồ sơ
                        </button>
                    )}
                </div>

                <div className="flex border-t border-gray-50 px-8 bg-gray-50/30 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'GENERAL', label: 'Thông tin chung', icon: FaIdCardAlt },
                        { id: 'SECURITY', label: 'Bảo mật', icon: FaUserShield },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as Tab); setIsEditing(false); }}
                            className={`py-5 px-8 text-[11px] font-black uppercase tracking-[0.2em] border-b-4 transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <tab.icon className={activeTab === tab.id ? 'animate-bounce' : ''} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 transition-all hover:shadow-xl hover:shadow-emerald-500/5 min-h-[400px]">
                {activeTab === 'GENERAL' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {isEditing ? (
                            profileUser ? (
                                <ProfileEditForm
                                    user={profileUser}
                                    isLoading={isSaving}
                                    onSubmit={handleUpdateProfile}
                                    onCancel={() => setIsEditing(false)}
                                />
                            ) : null
                        ) : (
                            profileUser ? <ProfileInfo user={profileUser} /> : null
                        )}
                    </div>
                )}

                {activeTab === 'SECURITY' && (
                    <PasswordChangeForm onSubmit={handleChangePassword} isLoading={isSaving} />
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
