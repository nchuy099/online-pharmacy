import React from 'react';
import { FaFilter, FaRotateLeft, FaChevronDown } from 'react-icons/fa6';

interface Props {
    priceRange: { min?: number, max?: number };
    onPriceRangeSelect: (min?: number, max?: number) => void;
    onResetFilters: () => void;
    priceRanges: Array<{ label: string, min: number, max: number }>;
}

export const ProductsFilterSidebar: React.FC<Props> = ({
    priceRange,
    onPriceRangeSelect,
    onResetFilters,
    priceRanges
}) => {
    return (
        <aside className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-emerald-500 text-sm" />
                        <h2 className="text-base font-black text-[#001737]">Bộ lọc nâng cao</h2>
                    </div>
                    <button onClick={onResetFilters} className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 hover:text-emerald-600 transition-colors">
                        <FaRotateLeft className="text-[10px]" /> Xóa lọc
                    </button>
                </div>

                <div className="p-6">
                    <div>
                        <div className="flex items-center justify-between mb-5 group cursor-pointer">
                            <h3 className="text-[16px] font-black text-[#001737]">Khoảng giá</h3>
                            <FaChevronDown className="text-xs text-gray-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <div className="space-y-3">
                            {priceRanges.map((range, idx) => {
                                const isActive = priceRange.min === range.min && priceRange.max === range.max;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onPriceRangeSelect(range.min, range.max)}
                                        className={`w-full py-3.5 px-4 rounded-2xl text-[14px] font-bold transition-all border text-center ${isActive ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-gray-100 text-[#001737] hover:border-emerald-200 hover:bg-emerald-50/30'}`}
                                    >
                                        {range.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
