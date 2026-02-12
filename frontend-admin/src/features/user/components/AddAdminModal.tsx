import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import userApi from '../api';
import { toast } from 'react-hot-toast';
import rbacApi from '../../rbac/api';
import { RoleOption } from '../../rbac/types';
import { AdminCreateUserReq } from '../types/dto';
import { resolveApiErrorMessage } from '../../../shared/services/apiError';

interface AddAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddAdminModal = ({ isOpen, onClose, onSuccess }: AddAdminModalProps) => {
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [formData, setFormData] = useState<AdminCreateUserReq>({
        email: '',
        fullName: '',
        password: '',
        roleName: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                email: '',
                fullName: '',
                password: '',
                roleName: ''
            });
            setShowPassword(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const loadRoles = async () => {
            try {
                setIsLoadingRoles(true);
                const response = await rbacApi.getAdminRoleOptions();
                const allowedRoles = response.data || [];

                setRoles(allowedRoles);
                setFormData((current) => ({
                    ...current,
                    roleName: allowedRoles[0]?.name || current.roleName,
                }));
            } catch (error) {
                console.error('Load role options error:', error);
                setRoles([]);
            } finally {
                setIsLoadingRoles(false);
            }
        };

        loadRoles();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await userApi.create(formData);
            toast.success('Thêm người dùng thành công');
            onSuccess();
        } catch (error: any) {
            toast.error(resolveApiErrorMessage(error, 'Có lỗi xảy ra khi thêm người dùng'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Thêm người dùng</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Họ và tên</label>
                        <input
                            required
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            autoComplete="off"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm"
                            placeholder="Nhập họ và tên"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                        <input
                            required
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="off"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm"
                            placeholder="example@smartpharma.vn"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu</label>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm pr-10"
                                placeholder="Nhập mật khẩu"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Vai trò</label>
                        <select
                            name="roleName"
                            value={formData.roleName}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                            disabled={isLoadingRoles || roles.length === 0}
                        >
                            {roles.length === 0 ? (
                                <option value="">Không có role phù hợp</option>
                            ) : roles.map((role) => (
                                <option key={role.id} value={role.name}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 border border-slate-200"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || roles.length === 0}
                            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : "Thêm mới"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAdminModal;
