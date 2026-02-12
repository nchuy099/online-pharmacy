import React from 'react';
import { useForm } from 'react-hook-form';
import type { ProfileUpdateData } from '../types/domain';
import type { User } from '../../user/types/domain';

interface ProfileEditFormProps {
    user: User;
    isLoading: boolean;
    onSubmit: (data: ProfileUpdateData) => Promise<void>;
    onCancel: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ user, isLoading, onSubmit, onCancel }) => {
    const { register, handleSubmit } = useForm<ProfileUpdateData>({
        defaultValues: {
            fullName: user.fullName || user.name || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || user.phone || '',
            dateOfBirth: user.dateOfBirth || '',
            gender: user.gender || '',
            biography: user.biography || '',
        },
    });

    const inputClassName = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Họ và tên</label>
                    <input {...register('fullName')} className={inputClassName} placeholder="Nhập họ và tên" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Email</label>
                    <input type="email" {...register('email')} className={inputClassName} placeholder="Nhập email" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Số điện thoại</label>
                    <input {...register('phoneNumber')} className={inputClassName} placeholder="Nhập số điện thoại" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Ngày sinh</label>
                    <input type="date" {...register('dateOfBirth')} className={inputClassName} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Giới tính</label>
                    <select {...register('gender')} className={inputClassName}>
                        <option value="">Chưa cập nhật</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Tiểu sử</label>
                    <textarea
                        {...register('biography')}
                        rows={4}
                        className={inputClassName}
                        placeholder="Mô tả ngắn về bạn"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </form>
    );
};

export default ProfileEditForm;
