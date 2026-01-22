import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaCapsules, FaArrowRight, FaChevronDown, FaTableCells, FaListUl } from "react-icons/fa6";
import type { Category } from "../types/domain";

interface CategoryExplorerProps {
    categories: Category[];
}

export const CategoryExplorer: React.FC<CategoryExplorerProps> = ({ categories }) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    return (
        <div className="space-y-4 pb-20 mt-2">
            {/* View Mode Switcher */}
            <div className="flex justify-end items-center gap-3 mb-4">
                <span className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Giao diện danh mục:</span>
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-300 hover:text-emerald-500'}`}
                    >
                        <FaTableCells className="text-base" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-300 hover:text-emerald-500'}`}
                    >
                        <FaListUl className="text-base" />
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                /* List View - Big rows (Current style) */
                <div className="space-y-8">
                    {categories.map((lvl1) => {
                        const isExpanded = expandedIds.has(lvl1.id);
                        const hasChildren = lvl1.children && lvl1.children.length > 0;

                        return (
                            <div key={lvl1.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
                                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors border border-emerald-100 group-hover:border-emerald-500">
                                            <FaCapsules className="text-2xl text-emerald-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-[#001737] group-hover:text-emerald-600 transition-colors">
                                                {lvl1.name}
                                            </h2>
                                            <p className="text-emerald-600 font-bold mt-0.5 bg-emerald-50 w-fit px-2.5 py-0.5 rounded-lg text-[13px]">
                                                {lvl1.productCount} sản phẩm
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Link
                                            to={`/${lvl1.slug}`}
                                            className="flex items-center gap-2 text-gray-400 font-black hover:text-emerald-600 transition-colors text-[13px] uppercase tracking-wider group/link bg-gray-50 px-4 py-2.5 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/30"
                                        >
                                            Tất cả <FaArrowRight className="text-[10px] group-hover/link:translate-x-1 transition-transform" />
                                        </Link>

                                        {hasChildren && (
                                            <button
                                                onClick={() => toggleExpand(lvl1.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[13px] uppercase tracking-wider transition-all ${isExpanded ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50'}`}
                                            >
                                                Phân loại <FaChevronDown className={`text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {hasChildren && (
                                    <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'grid-rows-[1fr] opacity-100 border-t border-gray-50' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="min-h-0">
                                            <div className="p-6 md:p-8 bg-slate-50/30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {lvl1.children?.map((lvl2) => (
                                                    <Link
                                                        key={lvl2.id}
                                                        to={`/${lvl2.slug}`}
                                                        className="bg-white p-4 rounded-2xl border border-gray-100/50 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 transition-all group/item flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-4 bg-emerald-500 rounded-full group-hover/item:scale-y-150 transition-transform"></div>
                                                            <span className="text-[15px] font-black text-[#001737] group-hover/item:text-emerald-600 transition-colors">
                                                                {lvl2.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md group-hover/item:bg-emerald-50 group-hover/item:text-emerald-500 transition-colors">
                                                            {lvl2.productCount}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Grid View - Level 1 as blocks in grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.map((lvl1) => {
                        const isExpanded = expandedIds.has(lvl1.id);
                        const hasChildren = lvl1.children && lvl1.children.length > 0;

                        return (
                            <div key={lvl1.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-emerald-500/5 group h-fit">
                                <div className="p-6">
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors border border-emerald-100 group-hover:border-emerald-500 shadow-sm">
                                            <FaCapsules className="text-3xl text-emerald-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-[#001737] line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                                {lvl1.name}
                                            </h2>
                                            <p className="text-emerald-600 font-bold mt-1 text-[12px] bg-emerald-50 px-2.5 py-0.5 rounded-lg inline-block">
                                                {lvl1.productCount} sản phẩm
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-6">
                                        <Link
                                            to={`/${lvl1.slug}`}
                                            className="w-full py-3 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 font-black text-[13px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-emerald-100"
                                        >
                                            Xem sản phẩm <FaArrowRight className="text-[10px]" />
                                        </Link>

                                        {hasChildren && (
                                            <button
                                                onClick={() => toggleExpand(lvl1.id)}
                                                className={`w-full py-3 rounded-xl font-black text-[13px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${isExpanded ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50'}`}
                                            >
                                                Phân loại <FaChevronDown className={`text-[10px] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {hasChildren && (
                                    <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'grid-rows-[1fr] opacity-100 border-t border-gray-50' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="min-h-0 bg-slate-50/30">
                                            <div className="p-4 flex flex-col gap-1.5">
                                                {lvl1.children?.map((lvl2) => (
                                                    <Link
                                                        key={lvl2.id}
                                                        to={`/${lvl2.slug}`}
                                                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all group/sub"
                                                    >
                                                        <span className="text-[14px] font-bold text-gray-500 group-hover/sub:text-emerald-600 line-clamp-1 flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-emerald-300 rounded-full"></div>
                                                            {lvl2.name}
                                                        </span>
                                                        <span className="text-[10px] font-black text-gray-300 group-hover/sub:text-emerald-500">
                                                            {lvl2.productCount}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
