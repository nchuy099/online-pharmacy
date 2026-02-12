import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaUserShield, FaIdCardAlt, FaEdit, FaSpinner, FaCog, FaMoon, FaSun, FaDesktop } from 'react-icons/fa';
import ProfileInfo from '../components/ProfileInfo';
import ProfileEditForm from '../components/ProfileEditForm';
import PasswordChangeForm from '../components/PasswordChangeForm';
import AvatarUpload from '../components/AvatarUpload';
import { profileService } from '../services/profile.service';
import type { PharmacistProfile, ProfileUpdateData, PasswordChangeData } from '../types/domain';
import { useTheme } from '../../../shared/context/ThemeContext';

type Tab = 'GENERAL' | 'SECURITY' | 'PREFERENCES';

export default function ProfilePage() {
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<Tab>('GENERAL');
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<PharmacistProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await profileService.getProfile();
                setProfile(data);
            } catch (error) {
                toast.error('Failed to load profile information.');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (data: ProfileUpdateData) => {
        setIsSaving(true);
        try {
            const updated = await profileService.updateProfile(data);
            setProfile(updated);
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch {

            toast.error('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (data: PasswordChangeData) => {
        setIsSaving(true);
        try {
            await profileService.changePassword(data);
            toast.success('Password changed successfully!');
            setActiveTab('GENERAL');
        } catch {

            toast.error('Failed to update password. Current password may be incorrect.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarSelect = (file: File) => {
        console.log('New avatar selected:', file.name);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <FaSpinner className="animate-spin text-4xl text-emerald-500" />
                <p className="text-gray-500 font-medium">Loading your profile...</p>
            </div>
        );
    }

    if (!profile) return null;

    const availability = profile.isApproved ? 'Approved' : 'Pending Approval';

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8 transition-colors">
                <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-700"></div>

                <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12">
                    <AvatarUpload
                        currentImageUrl={profile.avatarUrl}
                        onImageSelect={handleAvatarSelect}
                        isEditing={isEditing}
                    />

                    <div className="flex-1 text-center md:text-left pb-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.fullName}</h1>
                            <span className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100 dark:border-green-500/20 uppercase tracking-wide">
                                {availability}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">{profile.specialtyName || profile.specialtyCode || 'No specialty assigned'}</p>
                    </div>

                    {!isEditing && activeTab === 'GENERAL' && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="mb-2 flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                        >
                            <FaEdit /> Edit Profile
                        </button>
                    )}
                </div>

                <div className="flex border-t border-gray-50 dark:border-gray-700 px-8">
                    {[
                        { id: 'GENERAL', label: 'General Info', icon: FaIdCardAlt },
                        { id: 'SECURITY', label: 'Security', icon: FaUserShield },
                        { id: 'PREFERENCES', label: 'Preferences', icon: FaCog },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as Tab); setIsEditing(false); }}
                            className={`py-4 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            <tab.icon /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">
                {activeTab === 'GENERAL' && (
                    isEditing ? (
                        <ProfileEditForm
                            profile={profile}
                            onSave={handleUpdateProfile}
                            onCancel={() => setIsEditing(false)}
                            isLoading={isSaving}
                        />
                    ) : (
                        <ProfileInfo profile={profile} />
                    )
                )}

                {activeTab === 'SECURITY' && (
                    <PasswordChangeForm onSubmit={handleChangePassword} isLoading={isSaving} />
                )}

                {activeTab === 'PREFERENCES' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                        <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">Display Settings</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Customize the appearance of your Command Center.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { id: 'light', label: 'Light Mode', icon: FaSun, desc: 'Clean and bright aesthetic' },
                                { id: 'dark', label: 'Dark Mode', icon: FaMoon, desc: 'High contrast for low light' },
                                { id: 'system', label: 'System Sync', icon: FaDesktop, desc: 'Match your OS settings' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setTheme(item.id as 'light' | 'dark' | 'system')}
                                    className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 ${theme === item.id
                                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === item.id ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                        }`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`text-xs font-black uppercase tracking-wider ${theme === item.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                            {item.label}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
