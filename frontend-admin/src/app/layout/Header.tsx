import { useState } from "react";
import { FaSearch, FaUserCircle, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks";

interface HeaderProps {
    onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Searching for:", searchQuery);
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 fixed top-0 right-0 left-0 lg:left-64 z-40 transition-all">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Mobile menu button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                >
                    <FaBars className="h-5 w-5" />
                </button>

                {/* Search Bar */}
                <div className="flex-1 max-w-md mx-4 lg:mx-0">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl leading-5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                        />
                    </form>
                </div>

                {/* Right side actions */}
                <div className="flex items-center space-x-2 lg:space-x-4">
                    {/* User Profile */}
                    <div className="relative">
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center space-x-3 p-1.5 pr-3 text-gray-600 hover:bg-emerald-50 rounded-2xl transition-all group border border-transparent hover:border-emerald-100"
                        >
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50 group-hover:scale-105 transition-transform">
                                <FaUserCircle className="h-7 w-7" />
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-[11px] font-black text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tracking-wider leading-none mb-1">{user?.fullName || user?.name || "Admin User"}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{user?.role || "Quản trị viên"}</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
