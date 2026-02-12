import React, { useState } from 'react';
import { User } from '../types/domain';
import StatusBadge from '../components/StatusBadge';
import RoleBadges from '../components/RoleBadges';
import userService from '../services';
import { Button, Modal } from '../../../shared/components/ui';
import { FaUser, FaEdit, FaKey, FaUserSlash, FaUserCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface CustomerDetailPageProps {
    user: User;
    onRefresh: () => void;
}

const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ user, onRefresh }) => {
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
                                <Button 
                                    onClick={() => setIsEditModalVisible(true)}
                                    className="flex items-center gap-2"
                                    variant="outline"
                                >
                                    <FaEdit /> Sửa
                                </Button>
                                <Button 
                                    onClick={() => setIsPasswordModalVisible(true)}
                                    className="flex items-center gap-2"
                                    variant="outline"
                                >
                                    <FaKey /> Mật khẩu
                                </Button>
                                {user.status === 'ACTIVE' ? (
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

            {/* <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex border-b border-slate-100">
                    <TabButton 
                        active={activeTab === 'orders'} 
                        onClick={() => setActiveTab('orders')} 
                        icon={<FaHistory />}
                        label="Lịch sử mua hàng"
                    />
                    <TabButton 
                        active={activeTab === 'addresses'} 
                        onClick={() => setActiveTab('addresses')} 
                        icon={<FaMapMarkedAlt />}
                        label="Sổ địa chỉ"
                    />
                </div>
                <div className="p-6">
                    {activeTab === 'orders' ? (
                        <div className="space-y-4">
                            {isOrderLoading ? (
                                <div className="text-center py-12 text-slate-400">Đang tải đơn hàng...</div>
                            ) : orders.length > 0 ? (
                                <>
                                    <OrderTable orders={orders} />
                                    {orderPagination.totalPages > 1 && (
                                        <Pagination 
                                            currentPage={orderPagination.page} 
                                            totalPages={orderPagination.totalPages} 
                                            onPageChange={fetchOrders}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <FaHistory className="text-4xl mx-auto mb-2 opacity-20" />
                                    <p>Chưa có đơn hàng nào.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {isAddLoading ? (
                                <div className="text-center py-12 text-slate-400">Đang tải sổ địa chỉ...</div>
                            ) : addresses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map((addr) => (
                                        <div key={addr.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-slate-800">{addr.fullName}</span>
                                                {addr.isDefault && (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">Mặc định</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600">{addr.phoneNumber}</p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {addr.address}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <FaMapMarkedAlt className="text-4xl mx-auto mb-2 opacity-20" />
                                    <p>Chưa có địa chỉ nào.</p>
                                </div>
                            )}
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

export default CustomerDetailPage;
