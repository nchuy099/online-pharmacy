import { Link, useLocation } from "react-router-dom";
import type { ComponentType } from "react";
import {
    FaUsers,
    FaPills,
    FaShoppingCart,
    FaChartBar,
    FaBolt,
    FaSignOutAlt,
    FaTimes,
    FaChevronDown,
    FaChevronUp,
    FaUserCircle,
    FaUser,
    FaChevronLeft,
    FaBars,
    FaUserShield,
} from "react-icons/fa";
import { FaWarehouse } from "react-icons/fa6";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../features/auth/hooks";

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface MenuItem {
    path: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    active: boolean;
    permissions?: string[];
}

const Sidebar = ({ isOpen = false, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) => {
    const location = useLocation();
    const isRbac = location.pathname.startsWith('/rbac');
    const [rbacOpen, setRbacOpen] = useState(isRbac);
    const isInventory = location.pathname.startsWith('/inventories');

    const menuItemsTop: MenuItem[] = [
        { path: "/analytics", icon: FaChartBar, label: "Thống kê", active: location.pathname === "/analytics", permissions: ["READ_ANALYTICS"] },
        { path: "/users", icon: FaUsers, label: "Người dùng", active: location.pathname === "/users", permissions: ["READ_USER"] },
        // { path: "/medical-consultations", icon: FaUserMd, label: "Tư vấn y tế", active: isMedicalConsultation, permissions: ["READ_USER"] },
    ];

    const menuItemsBottom: MenuItem[] = [
        { path: "/categories", icon: FaPills, label: "Phân loại", active: location.pathname === "/categories", permissions: ["READ_CATEGORY"] },
        { path: "/products", icon: FaPills, label: "Sản phẩm", active: location.pathname === "/products", permissions: ["READ_PRODUCT"] },
        { path: "/flash-sales", icon: FaBolt, label: "Flash sale", active: location.pathname.startsWith("/flash-sales"), permissions: ["MANAGE_FLASH_SALE"] },
        { path: "/orders", icon: FaShoppingCart, label: "Đơn hàng", active: location.pathname === "/orders", permissions: ["READ_ORDER"] },
    ];

    const rbacView = new URLSearchParams(location.search).get('view');
    const rbacSubItems = [
        { path: '/rbac?view=admins', label: 'Quản trị viên', active: location.pathname === '/rbac' && rbacView === 'admins' },
        { path: '/rbac?view=roles', label: 'Vai trò', active: location.pathname.startsWith('/rbac/roles') || (location.pathname === '/rbac' && (!rbacView || rbacView === 'roles')) },
        { path: '/rbac?view=permissions', label: 'Quyền', active: location.pathname.startsWith('/rbac/permissions') || (location.pathname === '/rbac' && rbacView === 'permissions') },
    ];

    const { user, logout, hasPermission } = useAuth();
    const canAccess = (permissions?: string[]) => {
        return permissions?.length ? hasPermission(permissions) : true;
    };
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const mobileProfileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isClickInsideDesktop = profileRef.current?.contains(event.target as Node);
            const isClickInsideMobile = mobileProfileRef.current?.contains(event.target as Node);
            
            if (!isClickInsideDesktop && !isClickInsideMobile) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isRbac) {
            setRbacOpen(true);
        }
    }, [isRbac]);

    const handleLogout = () => {
        logout();
        onClose?.();
    };

    const handleLinkClick = () => {
        // Close mobile sidebar when link is clicked
        if (onClose) {
            onClose();
        }
    };

    return (
        <>
            {/* Mobile sidebar */}
            <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-gray-100 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-5 border-b border-gray-50 h-20">
                    <h1 className="ml-2 text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 tracking-tight">Admin <span className="text-gray-900">Panel</span></h1>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <nav className="mt-6 flex-1 overflow-y-auto">
                    <ul className="space-y-1.5 px-3">
                        {menuItemsTop.filter(item => canAccess(item.permissions)).map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={handleLinkClick}
                                    className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${item.active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50' : 'text-slate-500 hover:bg-gray-50 hover:text-emerald-600'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span className="ml-3.5 font-semibold">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                        {canAccess(["READ_RBAC"]) && (
                            <li>
                                <button
                                    onClick={() => setRbacOpen(o => !o)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${isRbac ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-gray-50 hover:text-emerald-600'
                                        }`}
                                >
                                    <span className="flex items-center gap-3.5">
                                        <FaUserShield className="w-4 h-4" />
                                        Phân quyền quản trị
                                    </span>
                                    <FaChevronDown className={`text-[10px] transition-transform duration-300 ${rbacOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {rbacOpen && (
                                    <ul className="ml-9 mt-1 space-y-1">
                                        {rbacSubItems.map((sub) => (
                                            <li key={sub.path}>
                                                <Link
                                                    to={sub.path}
                                                    onClick={handleLinkClick}
                                                    className={`flex items-center px-4 py-2 rounded-lg text-xs font-medium transition-all ${sub.active ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-400 hover:text-slate-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className={`w-1 h-1 rounded-full mr-3 ${sub.active ? 'bg-emerald-600 scale-125' : 'bg-slate-200'}`} />
                                                    {sub.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        )}
                        {canAccess(["READ_INVENTORY"]) && (
                            <li>
                                <Link
                                    to="/inventories/summary"
                                    onClick={handleLinkClick}
                                    className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${isInventory ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50' : 'text-slate-500 hover:bg-gray-50 hover:text-emerald-600'}`}
                                >
                                    <FaWarehouse className="w-4 h-4" />
                                    <span className="ml-3.5 font-semibold">Kho hàng</span>
                                </Link>
                            </li>
                        )}
                        {menuItemsBottom.filter(item => canAccess(item.permissions)).map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={handleLinkClick}
                                    className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${item.active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50' : 'text-slate-500 hover:bg-gray-50 hover:text-emerald-600'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span className="ml-3.5 font-semibold">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="absolute bottom-10 left-0 right-0 px-4" ref={mobileProfileRef}>
                    <div className="relative">
                        {profileOpen && (
                            <div className="absolute bottom-full left-0 w-full mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                                <div className="p-4 bg-slate-50/30 border-b border-gray-50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <FaUserCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quản lý phiên</p>
                                        <p className="text-[12px] font-bold text-gray-800 truncate">{user?.fullName || user?.name || "Admin User"}</p>
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    <Link
                                        to="/profile"
                                        onClick={() => { setProfileOpen(false); handleLinkClick(); }}
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group/popover"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover/popover:bg-emerald-100 group-hover/popover:text-emerald-600 transition-colors">
                                            <FaUser className="w-3.5 h-3.5" />
                                        </div>
                                        Hồ sơ cá nhân
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all group/popover"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-100/50 text-red-400 flex items-center justify-center group-hover/popover:bg-red-100 group-hover/popover:text-red-600 transition-colors">
                                            <FaSignOutAlt className="w-3.5 h-3.5" />
                                        </div>
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center w-full p-3.5 bg-white border border-gray-100 rounded-2xl transition-all hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1 shadow-sm group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50 group-hover:scale-105 transition-transform shrink-0">
                                <FaUserCircle className="h-10 w-10" />
                            </div>
                            <div className="flex-1 text-left truncate ml-4">
                                <p className="text-[12px] font-black text-slate-800 truncate uppercase leading-none mb-1.5 group-hover:text-emerald-600 transition-all tracking-tight">{user?.fullName || user?.name || "Admin User"}</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">{user?.role || "Quản trị viên"}</p>
                                </div>
                            </div>
                            <div className={`p-2 rounded-xl bg-gray-50 text-slate-300 transition-all ${profileOpen ? 'rotate-180' : ''}`}>
                                <FaChevronUp className="w-3 h-3" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className={`hidden lg:block bg-white shadow-xl h-screen sticky top-0 z-50 transition-all duration-300 border-r border-gray-100 shrink-0 ${isCollapsed ? 'w-20' : 'w-72'}`}>
                <div className="flex items-center justify-between p-5 border-b border-gray-50 h-20">
                    {!isCollapsed && (
                        <h1 className="ml-2 text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 tracking-tight">Admin <span className="text-gray-900">Panel</span></h1>
                    )}
                    <button
                        onClick={onToggleCollapse}
                        className={`p-2 rounded-xl text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all ${isCollapsed ? 'mx-auto' : ''}`}
                    >
                        {isCollapsed ? <FaBars className="w-4 h-4" /> : <FaChevronLeft className="w-3.5 h-3.5" />}
                    </button>
                </div>

                <nav className="mt-8">
                    <ul className="space-y-1.5 px-3">
                        {menuItemsTop.filter(item => canAccess(item.permissions)).map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    title={isCollapsed ? item.label : ""}
                                    className={`flex items-center rounded-xl transition-all duration-200 group relative ${isCollapsed ? 'justify-center p-3' : 'px-4 py-2.5'} ${item.active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50' : 'text-slate-500 hover:bg-gray-50 hover:text-emerald-600'
                                        }`}
                                >
                                    <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                                    {!isCollapsed && <span className="ml-3.5 font-semibold text-sm">{item.label}</span>}
                                    {isCollapsed && item.active && (
                                        <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                                    )}
                                </Link>
                            </li>
                        ))}
                        {canAccess(["READ_RBAC"]) && !isCollapsed && (
                            <li>
                                <button
                                    onClick={() => setRbacOpen(o => !o)}
                                    className={`w-full flex items-center justify-between rounded-xl transition-all duration-200 group relative px-4 py-2.5 ${isRbac ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-gray-50 hover:text-emerald-600'
                                        }`}
                                >
                                    <span className="flex items-center gap-3.5">
                                        <FaUserShield className="w-4 h-4" />
                                        <span className="font-semibold text-sm">Phân quyền quản trị</span>
                                    </span>
                                    <div className={`transition-transform duration-300 ${rbacOpen ? 'rotate-180' : ''}`}>
                                        <FaChevronDown className="text-[10px]" />
                                    </div>
                                </button>
                                {rbacOpen && (
                                    <ul className="ml-9 mt-1 space-y-1">
                                        {rbacSubItems.map((sub) => (
                                            <li key={sub.path}>
                                                <Link
                                                    to={sub.path}
                                                    onClick={handleLinkClick}
                                                    className={`flex items-center px-4 py-2 rounded-lg text-xs font-medium transition-all ${sub.active ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-400 hover:text-slate-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className={`w-1 h-1 rounded-full mr-3 ${sub.active ? 'bg-emerald-600 scale-125' : 'bg-slate-200'}`} />
                                                    {sub.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        )}

                        {canAccess(["READ_INVENTORY"]) && !isCollapsed && (
                            <li>
                                <Link
                                    to="/inventories/summary"
                                    title="Kho hàng"
                                    className={`flex items-center rounded-xl transition-all duration-200 group relative px-4 py-2.5 ${isInventory ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50' : 'text-slate-500 hover:bg-gray-50 hover:text-emerald-600'}`}
                                >
                                    <FaWarehouse className="w-4 h-4" />
                                    <span className="ml-3.5 font-semibold text-sm">Kho hàng</span>
                                </Link>
                            </li>
                        )}

                        {canAccess(["READ_INVENTORY"]) && isCollapsed && (
                            <li>
                                <Link
                                    to="/inventories/summary"
                                    title="Kho hàng"
                                    className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 group relative ${isInventory ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50' : 'text-slate-500 hover:bg-gray-50 hover:text-emerald-600'}`}
                                >
                                    <FaWarehouse className="w-5 h-5" />
                                    {isInventory && <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />}
                                </Link>
                            </li>
                        )}

                        {menuItemsBottom.filter(item => canAccess(item.permissions)).map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    title={isCollapsed ? item.label : ""}
                                    className={`flex items-center rounded-xl transition-all duration-200 group relative ${isCollapsed ? 'justify-center p-3' : 'px-4 py-2.5'} ${item.active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50' : 'text-slate-500 hover:bg-gray-50 hover:text-emerald-600'
                                        }`}
                                >
                                    <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                                    {!isCollapsed && <span className="ml-3.5 font-semibold text-sm">{item.label}</span>}
                                    {isCollapsed && item.active && (
                                        <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className={`absolute left-0 right-0 px-4 transition-all duration-300 ${isCollapsed ? 'bottom-8' : 'bottom-10'}`} ref={profileRef}>
                    <div className="relative">
                        {profileOpen && !isCollapsed && (
                            <div className="absolute bottom-full left-0 w-full mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                                <div className="p-4 bg-slate-50/30 border-b border-gray-50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <FaUserCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quản lý phiên</p>
                                        <p className="text-[12px] font-bold text-gray-800 truncate">{user?.fullName || user?.name || "Admin User"}</p>
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    <Link
                                        to="/profile"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group/popover"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover/popover:bg-emerald-100 group-hover/popover:text-emerald-600 transition-colors">
                                            <FaUser className="w-3.5 h-3.5" />
                                        </div>
                                        Thông tin cá nhân
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all group/popover"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-100/50 text-red-400 flex items-center justify-center group-hover/popover:bg-red-100 group-hover/popover:text-red-600 transition-colors">
                                            <FaSignOutAlt className="w-3.5 h-3.5" />
                                        </div>
                                        Đăng xuất ngay
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => isCollapsed ? onToggleCollapse?.() : setProfileOpen(!profileOpen)}
                            className={`flex items-center transition-all duration-300 border rounded-2xl group ${isCollapsed ? 'justify-center w-12 h-12 mx-auto bg-emerald-50 border-emerald-100' : 'w-full p-3.5 bg-white border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1 shadow-sm'}`}
                        >
                            <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50 group-hover:scale-105 transition-transform shrink-0`}>
                                <FaUserCircle className={`${isCollapsed ? 'h-8 w-8' : 'h-10 w-10'}`} />
                            </div>
                            {!isCollapsed && (
                                <>
                                    <div className="flex-1 text-left truncate ml-4">
                                        <p className="text-[12px] font-black text-slate-800 truncate uppercase leading-none mb-1.5 group-hover:text-emerald-600 transition-all tracking-tight">{user?.fullName || user?.name || "Admin User"}</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">{user?.role || "Quản trị viên"}</p>
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded-xl bg-gray-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all ${profileOpen ? 'rotate-180' : ''}`}>
                                        <FaChevronUp className="w-3 h-3" />
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar; 
