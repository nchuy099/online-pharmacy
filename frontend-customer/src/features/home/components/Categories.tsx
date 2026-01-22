import { Link } from "react-router-dom";
import { useCategories } from "@/features/product/hooks/useCategories";
import { getTopLevelCategoriesByProductCount } from "@/features/shared/utils/topCategories";

const CATEGORY_ICONS: Record<string, string> = {
    "tim-mach": "https://cdn-icons-png.flaticon.com/512/3004/3004458.png",
    "tieu-hoa": "https://cdn-icons-png.flaticon.com/512/3022/3022213.png",
    "ho-hap": "https://cdn-icons-png.flaticon.com/512/2864/2864311.png",
    "da-lieu": "https://cdn-icons-png.flaticon.com/512/2841/2841364.png",
    "xuong-khop": "https://cdn-icons-png.flaticon.com/512/2864/2864293.png",
    "than-kinh-giac-ngu": "https://cdn-icons-png.flaticon.com/512/3022/3022204.png",
    "vitamin-khoang-chat": "https://cdn-icons-png.flaticon.com/512/2864/2864267.png",
    "khac": "https://cdn-icons-png.flaticon.com/512/2864/2864261.png"
};

export const Categories = () => {
    const { data: categories, isLoading } = useCategories();

    if (isLoading) {
        return (
            <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
                <h2 className="text-2xl md:text-3xl font-black text-[#001737] mb-8 font-primary">Danh mục sản phẩm</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            </section>
        );
    }

    const topCategories = categories ? getTopLevelCategoriesByProductCount(categories) : [];

    return (
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
            <h2 className="text-2xl md:text-3xl font-black text-[#001737] mb-8 font-primary">Danh mục sản phẩm</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {topCategories.map((category) => (
                    <Link
                        key={category.id}
                        to={`/${category.slug}`}
                        className="p-5 bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group flex items-center gap-4 min-h-[90px]"
                    >
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors p-2 shrink-0">
                            <img
                                src={CATEGORY_ICONS[category.slug] || CATEGORY_ICONS["khac"]}
                                alt={category.name}
                                className="w-full h-full object-contain grayscale-[0.5] group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100 group-hover:scale-110"
                            />
                        </div>
                        <span className="text-[14px] md:text-[15px] font-black text-gray-700 group-hover:text-emerald-700 transition-colors leading-tight uppercase tracking-tight">
                            {category.name}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
};
