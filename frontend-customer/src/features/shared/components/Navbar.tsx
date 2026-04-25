import { Link, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa6';
import { useCategories } from '@/features/product/hooks/useCategories';
import { getTopLevelCategoriesByProductCount } from '@/features/shared/utils/topCategories';

export const Navbar = () => {
    const { data: categories, isLoading } = useCategories();
    const location = useLocation();
    const topCategories = categories ? getTopLevelCategoriesByProductCount(categories) : [];

    if (isLoading) {
        return (
            <nav className="bg-white border-b border-gray-100 overflow-x-auto no-scrollbar hidden md:block">
                <div className="mx-auto max-w-[1500px] px-6">
                    <ul className="flex items-center gap-8 py-3.5 min-w-max">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <li key={i} className="h-5 w-28 bg-gray-100 animate-pulse rounded-full"></li>
                        ))}
                    </ul>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 hidden md:block z-30">
            <div className="mx-auto max-w-[1500px] px-6">
                <ul className="flex items-center gap-2 py-1 min-w-max">
                    {/* All Categories Button */}
                    <li className="mr-4 pr-4 border-r border-gray-100">
                        <Link
                            to="/products"
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-[#001737] hover:text-emerald-600 transition-all font-bold text-sm group"
                        >
                            <FaBars className="text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span>Tất cả danh mục</span>
                        </Link>
                    </li>

                    {/* Level 1 Categories Only - No Dropdowns */}
                    {topCategories.map((cat) => {
                        const isActive = location.pathname.includes(cat.slug);
                        return (
                            <li key={cat.id} className="relative">
                                <Link
                                    to={`/${cat.slug}`}
                                    className={`flex items-center gap-1.5 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
                                >
                                    <span className="text-[14px] font-bold whitespace-nowrap">
                                        {cat.name}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};
