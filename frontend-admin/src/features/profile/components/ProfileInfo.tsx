import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaVenusMars, FaShieldAlt, FaClock } from 'react-icons/fa';
import type { User } from '../../user/types/domain';

interface Props {
    user: User;
}

const ProfileInfo: React.FC<Props> = ({ user }) => {
    const infoItems = [
        { label: "Họ và tên", value: user.fullName || user.name, icon: FaUser },
        { label: "Email", value: user.email, icon: FaEnvelope },
        { label: "Số điện thoại", value: user.phone || user.phoneNumber || "Chưa cập nhật", icon: FaPhone },
        { label: "Ngày sinh", value: user.dateOfBirth || "Chưa cập nhật", icon: FaCalendarAlt },
        { label: "Giới tính", value: user.gender || "Chưa cập nhật", icon: FaVenusMars },
        { label: "Vai trò", value: user.role || user.roles?.join(', '), icon: FaShieldAlt },
        { label: "Ngày tham gia", value: user.joinDate || "Chưa rõ", icon: FaClock },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {infoItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-emerald-100 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-gray-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                            <p className="text-sm font-bold text-gray-900">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 mt-8">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[11px] font-bold text-emerald-800 italic">Tài khoản này đang ở trạng thái <span className="underline decoration-emerald-200 uppercase">{user.status}</span></p>
                </div>
            </div>
        </div>
    );
};

export default ProfileInfo;
