import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaUser,
    FaBox,
    FaLocationDot,
    FaChevronRight,
    FaFilePrescription
} from 'react-icons/fa6';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import type { User } from '../types/domain';

export const AccountSidebar: React.FC = () => {
    // Auth User type might be basic, so we cast to the full User type from user feature
    const { user } = useAuthContext() as unknown as { user: User | null };

    const menuItems = [
        {
            path: '/me/profile',
            icon: FaUser,
            label: 'Thông tin cá nhân',
        },
        {
            path: '/me/orders',
            icon: FaBox,
            label: 'Đơn hàng của tôi',
        },
        {
            path: '/me/prescriptions',
            icon: FaFilePrescription,
            label: 'Đơn thuốc của tôi',
        },
        {
            path: '/me/addresses',
            icon: FaLocationDot,
            label: 'Quản lý sổ địa chỉ',
        },
    ];

    return (
        <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[32px] p-8 text-white text-center shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>

                <div className="relative z-10">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-white/30 shadow-inner">
                        <FaUser className="text-3xl text-white outline-none" />
                    </div>
                    <h3 className="font-black text-lg uppercase tracking-wider mb-1">
                        {user?.fullName || 'Khách hàng'}
                    </h3>
                    <p className="text-white/80 font-bold text-sm">
                        {user?.phoneNumber || 'Chưa cập nhật SĐT'}
                    </p>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden p-3 transition-all">
                <div className="space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center justify-between px-5 py-4 rounded-2xl transition-all group
                                ${isActive
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-600'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                            ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-emerald-500'}
                                        `}>
                                            <item.icon className="text-lg" />
                                        </div>
                                        <span className="font-bold text-[15px]">{item.label}</span>
                                    </div>
                                    <FaChevronRight className="text-[10px] opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
};
