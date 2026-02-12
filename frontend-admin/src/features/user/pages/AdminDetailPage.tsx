import React, { useState } from 'react';
import { User } from '../types/domain';
import StatusBadge from '../components/StatusBadge';
import RoleBadges from '../components/RoleBadges';
import userService from '../services';
import { Button, Modal } from '../../../shared/components/ui';
import { FaUser, FaEdit, FaKey, FaUserSlash, FaUserCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/hooks';

interface AdminDetailPageProps {
    user: User;
    onRefresh: () => void;
}

const AdminDetailPage: React.FC<AdminDetailPageProps> = ({ user, onRefresh }) => {
    const { hasPermission } = useAuth();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [isStatusConfirmVisible, setIsStatusConfirmVisible] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<'ACTIVE' | 'SUSPENDED'>('SUSPENDED');
    const [isStatusSaving, setIsStatusSaving] = useState(false);
    
    const [editData, setEditData] = useState({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || user.phone || '',
        email: user.email || ''
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: ''
    });

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (user.role === 'SUPER_ADMIN') return;
        try {
            await userService.update(user.id, editData);
            toast.success('Cập nhật thông tin thành công');
            setIsEditModalVisible(false);
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi cập nhật thông tin');
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await userService.resetPassword(user.id, passwordData);
            toast.success('Đặt lại mật khẩu thành công');
            setIsPasswordModalVisible(false);
            setPasswordData({ newPassword: '' });
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi đặt lại mật khẩu');
        }
    };

    const openStatusConfirm = () => {
        const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        setPendingStatus(nextStatus);
        setIsStatusConfirmVisible(true);
    };

    const handleStatusSave = async () => {
        setIsStatusSaving(true);
        try {
            await userService.changeStatus(user.id, { status: pendingStatus });
            toast.success('Thay đổi trạng thái thành công');
            setIsStatusConfirmVisible(false);
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi thay đổi trạng thái');
        } finally {
            setIsStatusSaving(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const canEditUser = hasPermission('UPDATE_USER') && !isSuperAdmin;
    const canResetPassword = hasPermission('RESET_USER_PASSWORD') && !isSuperAdmin;
    const canChangeStatus = hasPermission('UPDATE_USER_STATUS') && !isSuperAdmin;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row items-start gap-8">
                    <div className="relative group">
                        {user.avatarUrl ? (
                            <img 
                                src={user.avatarUrl} 
                                alt="Avatar" 
                                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-50"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-3xl">
                                <FaUser />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{user.fullName || user.name || 'N/A'}</h1>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <StatusBadge status={user.status} />
                                    <RoleBadges roles={user.roles} role={user.role} />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {canEditUser && (
                                    <Button 
                                        onClick={() => setIsEditModalVisible(true)}
                                        className="flex items-center gap-2"
                                        variant="outline"
                                    >
                                        <FaEdit /> Sửa
                                    </Button>
                                )}
                                {canResetPassword && (
                                    <Button 
                                        onClick={() => setIsPasswordModalVisible(true)}
                                        className="flex items-center gap-2"
                                        variant="outline"
                                    >
                                        <FaKey /> Mật khẩu
                                    </Button>
                                )}
                                {canChangeStatus && (
                                    user.status === 'ACTIVE' ? (
                                        <Button 
                                            onClick={openStatusConfirm}
                                            className="flex items-center gap-2 !bg-rose-50 !text-rose-600 !border-rose-100 hover:!bg-rose-100"
                                        >
                                            <FaUserSlash /> Xóa tài khoản
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={openStatusConfirm}
                                            className="flex items-center gap-2 !bg-emerald-50 !text-emerald-600 !border-emerald-100 hover:!bg-emerald-100"
                                        >
                                            <FaUserCheck /> Kích hoạt
                                        </Button>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-slate-50">
                            <InfoItem label="Email" value={user.email} />
                            <InfoItem label="Số điện thoại" value={user.phoneNumber || user.phone || 'N/A'} />
                            <InfoItem label="Giới tính" value={user.gender === 'MALE' ? 'Nam' : user.gender === 'FEMALE' ? 'Nữ' : 'N/A'} />
                            <InfoItem label="Ngày sinh" value={user.dateOfBirth || 'N/A'} />
                            <InfoItem label="Ngày tạo" value={formatDate(user.createdAt)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Quyền hạn hệ thống</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.role === 'SUPER_ADMIN' ? (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 col-span-2">
                             <p className="font-bold text-emerald-800 mb-1">Super Admin</p>
                             <p className="text-sm text-emerald-600 italic">Có toàn quyền truy cập và quản lý tất cả các mô-đun trong hệ thống (Người dùng, Đơn hàng, Kho hàng, Cấu hình).</p>
                         </div>
                    ) : user.role === 'STAFF' ? (
                        <>
                            <PermissionBadge label="Quản lý sản phẩm & kho" active />
                            <PermissionBadge label="Quản lý đơn hàng" active />
                            <PermissionBadge label="Quản lý danh mục" active />
                            <PermissionBadge label="Xem báo cáo cơ bản" active />
                        </>
                    ) : user.role === 'PHARMACIST' ? (
                        <>
                            <PermissionBadge label="Tư vấn y tế" active />
                            <PermissionBadge label="Quản lý phiên hỗ trợ" active />
                            <PermissionBadge label="Xem hồ sơ bệnh lý" active />
                            <PermissionBadge label="Kê đơn trực tuyến" active />
                        </>
                    ) : (
                        <div className="p-4 bg-slate-50 rounded-xl text-slate-600 text-sm italic col-span-2">
                            Các chức năng và quyền hạn được áp dụng tự động theo vai trò <span className="font-bold text-emerald-600">{user.role}</span>.
                        </div>
                    )}
                </div>
            </div> */}

            {/* Edit Modal */}
            <Modal 
                isOpen={isEditModalVisible} 
                onClose={() => setIsEditModalVisible(false)}
                title="Sửa thông tin tài khoản"
            >
                <form onSubmit={handleEditSave} className="space-y-4 p-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            value={editData.fullName}
                            onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            value={editData.phoneNumber}
                            onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            value={editData.email}
                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => setIsEditModalVisible(false)}>Hủy</Button>
                        <Button type="submit">Lưu thay đổi</Button>
                    </div>
                </form>
            </Modal>

            {/* Password Modal */}
            <Modal 
                isOpen={isPasswordModalVisible} 
                onClose={() => setIsPasswordModalVisible(false)}
                title="Đặt lại mật khẩu"
            >
                <form onSubmit={handlePasswordSave} className="space-y-4 p-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({newPassword: e.target.value})}
                            placeholder="Nhập mật khẩu mới"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => setIsPasswordModalVisible(false)}>Hủy</Button>
                        <Button type="submit">Xác nhận đặt lại</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isStatusConfirmVisible}
                onClose={() => setIsStatusConfirmVisible(false)}
                title={pendingStatus === 'ACTIVE' ? 'Xác nhận kích hoạt tài khoản' : 'Xác nhận đình chỉ tài khoản'}
            >
                <div className="space-y-4 p-4">
                    <p className="text-sm text-slate-600">
                        {pendingStatus === 'ACTIVE'
                            ? 'Tài khoản sẽ được kích hoạt lại và người dùng có thể đăng nhập bình thường.'
                            : 'Tài khoản sẽ bị đình chỉ và người dùng sẽ không thể đăng nhập cho đến khi được kích hoạt lại.'}
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" type="button" onClick={() => setIsStatusConfirmVisible(false)}>
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            onClick={handleStatusSave}
                            disabled={isStatusSaving}
                            className={pendingStatus === 'ACTIVE'
                                ? '!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700 !text-white'
                                : '!bg-rose-600 !border-rose-600 hover:!bg-rose-700 !text-white'}
                        >
                            {isStatusSaving
                                ? 'Đang xử lý...'
                                : pendingStatus === 'ACTIVE'
                                    ? 'Kích hoạt'
                                    : 'Đình chỉ'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-slate-700 font-medium">{value}</span>
    </div>
);

export default AdminDetailPage;
