import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight, FaHouse } from "react-icons/fa6";

interface Category {
    id: string;
    slug: string;
    name: string;
}

interface Props {
    categories?: Category[];
}

export const ProductBreadcrumb: React.FC<Props> = ({ categories }) => {
    return (
        <div className="max-w-7xl mx-auto px-6 py-2">
            <nav className="flex items-center gap-2 text-[13px] font-bold text-gray-500 bg-white w-fit px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                <Link to="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                    <FaHouse className="text-xs" /> Trang chủ
                </Link>

                {categories?.map((cat) => (
                    <React.Fragment key={cat.id}>
                        <FaChevronRight className="text-[10px] opacity-30" />
                        <Link to={`/${cat.slug}`} className="hover:text-emerald-600 transition-colors">
                            {cat.name}
                        </Link>
                    </React.Fragment>
                ))}
            </nav>
        </div>
    );
};
