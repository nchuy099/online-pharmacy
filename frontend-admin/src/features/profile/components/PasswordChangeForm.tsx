import { useForm } from 'react-hook-form';
import { FaLock, FaKey, FaSpinner } from 'react-icons/fa';
import type { PasswordChangeData } from '../types/domain';

interface PasswordChangeFormProps {
    onSubmit: (data: PasswordChangeData) => void;
    isLoading: boolean;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onSubmit, isLoading }) => {
    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<PasswordChangeData>();

    const newPassword = watch('newPassword');

    const handleFormSubmit = async (data: PasswordChangeData) => {
        await onSubmit(data);
        reset();
    };

    const inputClasses = "w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none";

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                    <FaKey className="text-xl" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Cập nhật mật khẩu</h3>
                    <p className="text-[11px] font-bold text-gray-400">Đảm bảo tài khoản của bạn được bảo mật an toàn.</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Current Password */}
                <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="password"
                        placeholder="Mật khẩu hiện tại"
                        {...register('currentPassword', { required: 'Vui lòng nhập mật khẩu hiện tại' })}
                        className={inputClasses}
                    />
                    {errors.currentPassword && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase tracking-wider">{errors.currentPassword.message}</p>}
                </div>

                <div className="h-[1px] bg-gray-50 my-2"></div>

                {/* New Password */}
                <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="password"
                        placeholder="Mật khẩu mới"
                        {...register('newPassword', {
                            required: 'Vui lòng nhập mật khẩu mới',
                            minLength: { value: 6, message: 'Tối thiểu 6 ký tự' }
                        })}
                        className={inputClasses}
                    />
                    {errors.newPassword && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase tracking-wider">{errors.newPassword.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="password"
                        placeholder="Xác nhận mật khẩu mới"
                        {...register('confirmPassword', {
                            required: 'Vui lòng xác nhận mật khẩu mới',
                            validate: value => value === newPassword || 'Mật khẩu xác nhận không khớp'
                        })}
                        className={inputClasses}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase tracking-wider">{errors.confirmPassword.message}</p>}
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gray-900 border border-gray-800 hover:bg-emerald-600 hover:border-emerald-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-gray-200 hover:shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <FaSpinner className="animate-spin text-sm" /> Đang cập nhật...
                    </>
                ) : (
                    <>Cập nhật mật khẩu</>
                )}
            </button>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 italic">
                <p className="text-[10px] text-center text-gray-400 font-bold leading-relaxed">
                    Sau khi cập nhật mật khẩu, phiên đăng nhập hiện tại vẫn sẽ được duy trì. Bạn có thể cần đăng nhập lại trên các thiết bị khác.
                </p>
            </div>
        </form>
    );
};

export default PasswordChangeForm;
