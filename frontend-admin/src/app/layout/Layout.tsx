import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { colors } from "../../shared/theme";

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: `${colors.gray[900]}40`, // theme gray-900 at 25% opacity
                        zIndex: 40
                    }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <main className="flex-1 transition-all duration-300 min-h-screen overflow-x-hidden">
                <div className="p-4 lg:px-6 lg:py-4 mx-auto">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden mb-6 p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-500 hover:text-emerald-600 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                    </button>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
