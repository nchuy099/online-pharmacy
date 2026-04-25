import React, { useState, useRef, useEffect } from "react"
import { FaBars, FaXmark, FaCartShopping, FaMagnifyingGlass, FaPills, FaUser, FaClipboardList, FaArrowRightFromBracket, FaPhone, FaLocationDot, FaChevronDown } from "react-icons/fa6"
import { Link, useNavigate } from "react-router-dom"
import { useAuthContext } from "../../auth/context/AuthContext"
import { useCart } from "../../cart/hooks/useCart"
import { useCategories } from "@/features/product/hooks/useCategories"
import { ProductSearchBar } from "@/features/product/components/ProductSearchBar"

export const Header = () => {
    const { user, logout, openAuthModal } = useAuthContext();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const { data: categories } = useCategories();
    const { data: cartData } = useCart(1, !!user);
    const lastCartPage = cartData?.pages?.[cartData.pages.length - 1];


    const cartCount = lastCartPage?.totalItems || 0;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
        navigate("/");
    };


    return (
        <div className="flex flex-col">
            {/* Top bar - Optional utility links for premium feel */}
            <div className="bg-[#001737] text-white py-1.5 px-6 hidden md:block">
                <div className="mx-auto flex max-w-[1500px] justify-between items-center text-[12px] font-medium opacity-90">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5">
                            <FaPhone className="text-emerald-400" />
                            <span>Hotline: <span className="font-bold">1800 1234</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <FaLocationDot className="text-emerald-400" />
                            <span>Hệ thống 500+ nhà thuốc toàn quốc</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/about" className="hover:text-emerald-400 transition-colors">Về SmartPharma</Link>
                        <Link to="/contact" className="hover:text-emerald-400 transition-colors">Liên hệ</Link>
                    </div>
                </div>
            </div>

            {/* DESKTOP HEADER */}
            <header className="hidden md:block sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 font-primary transition-all duration-300">
                <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-8 px-6 py-4">
                    {/* Logo Section */}
                    <Link to="/" className="flex items-center gap-3 min-w-fit group">
                        <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[14px] flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                            <FaPills className="text-white text-xl" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-2xl text-[#001737] tracking-tight leading-none group-hover:text-emerald-600 transition-colors whitespace-nowrap">SmartPharma</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[2px] mt-1">Chăm sóc sức khỏe</span>
                        </div>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <ProductSearchBar variant="desktop" />

                    {/* Right Actions */}
                    <div className="flex items-center gap-5">
                        {/* Cart */}
                        {user && (
                            <Link to="/cart">
                                <button className="relative w-11 h-11 flex items-center justify-center text-[#001737] hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 rounded-2xl transition-all group">
                                    <FaCartShopping className="text-xl group-hover:scale-110 transition-transform" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </Link>
                        )}

                        {/* User Profile */}
                        {user ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className={`flex items-center gap-2 p-1.5 pr-4 rounded-2xl transition-all ${isUserMenuOpen ? 'bg-emerald-50 ring-1 ring-emerald-500/20' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm">
                                        {user.fullName?.charAt(0) || "U"}
                                    </div>
                                    <div className="hidden lg:flex flex-col items-start truncate max-w-[100px]">
                                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Tài khoản</span>
                                        <span className="text-xs font-black text-[#001737] truncate">{user.fullName || "Người dùng"}</span>
                                    </div>
                                    <FaChevronDown className={`text-[10px] text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="px-6 py-5 bg-gradient-to-br from-emerald-50 to-white border-b border-gray-50">
                                            <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Thành viên</p>
                                            <p className="font-black text-gray-900 truncate text-base">{user.fullName || "Người dùng"}</p>
                                        </div>
                                        <div className="p-2">
                                            <Link
                                                to="/me"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all font-bold text-sm"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white">
                                                    <FaUser className="text-sm opacity-70" />
                                                </div>
                                                <span>Hồ sơ cá nhân</span>
                                            </Link>
                                            <Link
                                                to="/orders/history"
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all font-bold text-sm"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white">
                                                    <FaClipboardList className="text-sm opacity-70" />
                                                </div>
                                                <span>Quản lý đơn hàng</span>
                                            </Link>
                                            <div className="h-px bg-gray-50 my-2 mx-4"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                                    <FaArrowRightFromBracket className="text-sm opacity-70" />
                                                </div>
                                                <span>Đăng xuất tài khoản</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={openAuthModal}
                                className="px-6 py-3 bg-[#001737] text-white rounded-[16px] text-sm font-black hover:bg-emerald-600 shadow-lg shadow-gray-200 hover:shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <FaUser className="text-xs" />
                                Đăng nhập
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* MOBILE ONLY HEADER (Matches reference layout: Hamburger + Search + Cart) */}
            <div className="md:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-4 py-3">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="text-[#001737] p-1.5 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                    <FaBars className="text-2xl" />
                </button>
                <ProductSearchBar variant="mobile" />
                {/* Mobile Cart Icon next to Search */}
                {user && (
                    <Link to="/cart" className="relative p-1.5 text-[#001737] hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors">
                        <FaCartShopping className="text-xl" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_0_2px_white] animate-bounce">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                )}
            </div>

            {/* Mobile Menu Drawer */}
            <div
                className={`fixed inset-0 z-[100] transition-all duration-500 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-[#001737]/40 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Drawer Content */}
                <div
                    ref={mobileMenuRef}
                    className={`absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl transition-transform duration-500 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="flex flex-col h-full">
                        {/* Drawer Header matching brand */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/20">
                                    <FaPills className="text-white text-sm" />
                                </div>
                                <span className="font-black text-lg text-[#001737]">SmartPharma</span>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <FaXmark className="text-xl" />
                            </button>
                        </div>

                        {/* User Area in Drawer */}
                        {user ? (
                            <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50/50 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-lg">
                                    {user.fullName?.charAt(0) || "U"}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Xin chào,</span>
                                    <span className="text-sm font-black text-[#001737] truncate">{user.fullName || "Người dùng"}</span>
                                </div>
                            </div>
                        ) : null}

                        {/* Drawer Navigation */}
                        <div className="flex-1 overflow-y-auto py-4 px-2">
                            <nav className="space-y-1">
                                <MobileNavLink to="/" label="Trang chủ" onClick={() => setIsMobileMenuOpen(false)} icon={<FaPills />} />
                                <MobileNavLink to="/products" label="Tất cả sản phẩm" onClick={() => setIsMobileMenuOpen(false)} icon={<FaMagnifyingGlass />} />

                                {user && (
                                    <>
                                        <MobileNavLink to="/me" label="Hồ sơ cá nhân" onClick={() => setIsMobileMenuOpen(false)} icon={<FaUser />} />
                                        <MobileNavLink to="/orders/history" label="Quản lý đơn hàng" onClick={() => setIsMobileMenuOpen(false)} icon={<FaClipboardList />} />
                                    </>
                                )}

                                <div className="mt-8 mb-4 px-4">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Danh mục chính</p>
                                </div>

                                {categories?.filter(c => c.level === 1).map(cat => (
                                    <MobileNavLink
                                        key={cat.id}
                                        to={`/${cat.slug}`}
                                        label={cat.name}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    />
                                ))}

                                {user && (
                                    <div className="mt-8 px-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-all text-sm"
                                        >
                                            <FaArrowRightFromBracket /> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </nav>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                    <FaPhone />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Hỗ trợ 24/7</p>
                                    <p className="font-black text-[#001737]">1800 1234</p>
                                </div>
                            </div>
                            {!user && (
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        openAuthModal();
                                    }}
                                    className="w-full py-4 bg-[#001737] text-white rounded-2xl font-black text-center block shadow-lg shadow-[#001737]/20"
                                >
                                    Đăng nhập ngay
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const MobileNavLink = ({ to, label, onClick, icon }: { to: string, label: string, onClick: () => void, icon?: React.ReactNode }) => (
    <Link
        to={to}
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold transition-all text-sm"
    >
        {icon && <span className="opacity-70 text-base">{icon}</span>}
        {label}
    </Link>
)
