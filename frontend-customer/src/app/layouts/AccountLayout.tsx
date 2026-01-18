import React from 'react';
import { Outlet } from 'react-router-dom';
import { AccountSidebar } from '../../features/user/components/AccountSidebar';

export const AccountLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#F1F5F9] pt-6 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[13px] font-bold text-gray-400 mb-6 bg-white w-fit px-5 py-2.5 rounded-full border border-gray-100 shadow-sm">
                    <a href="/" className="hover:text-emerald-600 transition-colors font-primary">Trang chủ</a>
                    <span className="opacity-30">/</span>
                    <span className="text-gray-900 font-primary">Cá nhân</span>
                </nav>

                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <aside className="col-span-12 lg:col-span-3">
                        <AccountSidebar />
                    </aside>

                    {/* Main Content */}
                    <main className="col-span-12 lg:col-span-9">
                        <div className="bg-white rounded-[16px] md:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};
