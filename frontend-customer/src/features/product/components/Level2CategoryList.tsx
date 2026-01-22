import React, { useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaCapsules, FaVenusMars, FaRegEye, FaBrain, FaLeaf } from 'react-icons/fa';
import { FaShieldVirus, FaBacteria, FaDroplet, FaHeartPulse, FaLungs } from 'react-icons/fa6';
import type { Category } from '../types/domain';

interface Props {
    categories: Category[];
    activeSlug?: string;
    onCategorySelect: (slug: string) => void;
}

const LEVEL2_ICONS: Record<string, any> = {
    'mien-dich-de-khang': FaShieldVirus,
    'sinh-ly-noi-tiet-to': FaVenusMars,
    'mat-thi-luc': FaRegEye,
    'tieu-hoa': FaBacteria,
    'than-kinh-nao': FaBrain,
    'ho-tro-lam-dep': FaLeaf,
    'duong-huyet-tieu-duong': FaDroplet,
    'tim-mach-huyet-ap': FaHeartPulse,
    'ho-hap-tai-mui-hong': FaLungs,
    'default': FaCapsules
};

export const Level2CategoryList: React.FC<Props> = ({ categories, activeSlug, onCategorySelect }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (categories.length === 0) return null;

    return (
        <div className="relative mb-2 group">
            <button
                onClick={() => scroll('left')}
                className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:scale-110 active:scale-95 transition-all z-10 opacity-0 group-hover:opacity-100"
            >
                <FaChevronLeft className="text-lg" />
            </button>
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pt-1 pb-2 scroll-smooth no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {categories.map((cat: Category) => {
                    const Icon = LEVEL2_ICONS[cat.slug] || LEVEL2_ICONS.default;
                    const isActive = activeSlug === cat.slug;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onCategorySelect(cat.slug)}
                            className={`flex flex-col items-center justify-center min-w-[160px] h-[140px] bg-white rounded-[28px] border transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 group/card ${isActive ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : 'border-gray-100 hover:border-emerald-300'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-emerald-50 text-emerald-500 group-hover/card:bg-emerald-500 group-hover/card:text-white group-hover/card:shadow-lg group-hover/card:shadow-emerald-500/20'}`}>
                                <Icon className="text-xl" />
                            </div>
                            <span className={`font-black text-[13px] text-center px-3 transition-colors leading-tight line-clamp-2 ${isActive ? 'text-emerald-700' : 'text-gray-700'}`}>
                                {cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>
            <button
                onClick={() => scroll('right')}
                className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:scale-110 active:scale-95 transition-all z-10 opacity-0 group-hover:opacity-100"
            >
                <FaChevronRight className="text-lg" />
            </button>
        </div>
    );
};
