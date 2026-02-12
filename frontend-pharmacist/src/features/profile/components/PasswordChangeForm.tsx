import { useForm } from 'react-hook-form';
import { FaLock, FaKey } from 'react-icons/fa';
import type { PasswordChangeData } from '../types/domain';

interface PasswordChangeFormProps {
    onSubmit: (data: PasswordChangeData) => void;
    isLoading: boolean;
}

export default function PasswordChangeForm({ onSubmit, isLoading }: PasswordChangeFormProps) {
    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<PasswordChangeData>();

    const newPassword = watch('newPassword');

    const handleFormSubmit = async (data: PasswordChangeData) => {
        await onSubmit(data);
        reset(); // Clear form after success
    };

    const inputClasses = "w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none";

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-md mx-auto space-y-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full mb-3">
                    <FaKey className="text-xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Security Update</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ensure your account remains safe with a strong password.</p>
            </div>

            <div className="space-y-4">
                {/* Current Password */}
                <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="password"
                        placeholder="Current Password"
                        {...register('currentPassword', { required: 'Current password is required' })}
                        className={inputClasses}
                    />
                    {errors.currentPassword && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.currentPassword.message}</p>}
                </div>

                <hr className="border-gray-100 dark:border-gray-700/50" />

                {/* New Password */}
                <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="password"
                        placeholder="New Password"
                        {...register('newPassword', {
                            required: 'New password is required',
                            minLength: { value: 8, message: 'Minimum 8 characters' }
                        })}
                        className={inputClasses}
                    />
                    {errors.newPassword && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.newPassword.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        {...register('confirmNewPassword', {
                            required: 'Please confirm your password',
                            validate: value => value === newPassword || 'Passwords do not match'
                        })}
                        className={inputClasses}
                    />
                    {errors.confirmNewPassword && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.confirmNewPassword.message}</p>}
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl font-bold shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                {isLoading ? 'Updating Account...' : 'Update Password'}
            </button>

            <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 px-6">
                After updating your password, you may be required to log in again on other sessions for security purposes.
            </p>
        </form>
    );
}
