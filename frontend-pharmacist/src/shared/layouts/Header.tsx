import { FaUserCircle, FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
    const { user, logout } = useAuth();
    const { setTheme, resolvedTheme } = useTheme();
    const navigate = useNavigate();

    return (
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm transition-colors">
            <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">Command Center |</span>
                <span className="text-emerald-600 font-black tracking-tight">{user?.name}</span>
            </div>

            <div className="flex items-center gap-6">
                {/* Theme Toggle Button */}
                <button
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-100 dark:border-gray-700 transition-all group"
                    title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {resolvedTheme === 'dark' ? (
                        <FaSun className="text-orange-400 w-4 h-4 group-hover:rotate-45 transition-transform" />
                    ) : (
                        <FaMoon className="text-emerald-400 w-4 h-4 group-hover:-rotate-12 transition-transform" />
                    )}
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
                    </span>
                </button>

                <div className="relative group">
                    <button className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors">
                        <FaUserCircle className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                        <span className="font-bold text-sm tracking-tight">{user?.name}</span>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl dark:shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                        <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-700/50">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Pharmacist</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                        </div>
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full text-left px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors font-medium"
                        >
                            Profile
                        </button>
                        <button
                            onClick={logout}
                            className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors font-bold"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
