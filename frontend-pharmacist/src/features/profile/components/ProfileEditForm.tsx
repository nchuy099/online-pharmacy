import { useForm } from 'react-hook-form';
import type { PharmacistProfile, ProfileUpdateData } from '../types/domain';

const SPECIALTY_OPTIONS = [
    { code: 'GENERAL_MEDICINE', label: 'General Medicine' },
    { code: 'CARDIOLOGY', label: 'Cardiology' },
    { code: 'DIABETES', label: 'Diabetes' },
    { code: 'DERMATOLOGY', label: 'Dermatology' },
    { code: 'RESPIRATORY', label: 'Respiratory' },
    { code: 'DIGESTIVE', label: 'Digestive' },
];

interface ProfileEditFormProps {
    profile: PharmacistProfile;
    onSave: (data: ProfileUpdateData) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export default function ProfileEditForm({ profile, onSave, onCancel, isLoading }: ProfileEditFormProps) {
    const { register, handleSubmit } = useForm<ProfileUpdateData>({
        defaultValues: {
            qualifications: profile.qualifications || '',
            education: profile.education || '',
            experience: profile.experience || '',
            specialtyCode: profile.specialtyCode || 'GENERAL_MEDICINE',
        }
    });

    const inputClasses = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none';

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Specialty</label>
                <select {...register('specialtyCode')} className={inputClasses}>
                    {SPECIALTY_OPTIONS.map((item) => (
                        <option key={item.code} value={item.code}>{item.label}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Qualifications</label>
                <textarea
                    {...register('qualifications')}
                    rows={3}
                    className={inputClasses + ' resize-none'}
                    placeholder="PharmD, certifications, licenses..."
                />
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Education</label>
                <textarea
                    {...register('education')}
                    rows={3}
                    className={inputClasses + ' resize-none'}
                    placeholder="University, graduation year, notable training..."
                />
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Experience</label>
                <textarea
                    {...register('experience')}
                    rows={4}
                    className={inputClasses + ' resize-none'}
                    placeholder="Work background, years, clinical focus..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-lg font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    {isLoading ? 'Saving Changes...' : 'Save Profile'}
                </button>
            </div>
        </form>
    );
}
