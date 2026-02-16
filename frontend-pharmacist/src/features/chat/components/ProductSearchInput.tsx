import { useState, useEffect, useRef } from 'react';
import { chatApi } from '../api/chat.api';
import { chatService } from '../services/chat.service';
import type { CategoryDTO } from '../types/dto';
import type { ProductSearchOption } from '../types/domain';
import { FaSearch, FaSpinner, FaFilter, FaBox, FaTag, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import CategoryDrilldownModal from './CategoryDrilldownModal';
import { getCategoryPathLabel } from './categoryTree';

interface Props {
    onSelect: (option: ProductSearchOption) => void;
    placeholder?: string;
    value?: string;
}

export default function ProductSearchInput({ onSelect, placeholder, value }: Props) {
    const [query, setQuery] = useState(value || '');
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [results, setResults] = useState<ProductSearchOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await chatApi.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Fetch categories error:', error);
            }
        };
        fetchCategories();
    }, []);

    // Sync internal query with prop value (important for display after selection)
    useEffect(() => {
        if (value !== undefined) {
            setQuery(value);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!selectedCategory && query.trim().length < 2 && !isOpen) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            if (!selectedCategory && query.trim().length < 2) {
                setResults([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const data = await chatService.searchProducts(query, selectedCategory);
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, selectedCategory, isOpen]);

    const handleSelect = (option: ProductSearchOption) => {
        onSelect(option);
        setIsOpen(false);
    };

    const selectedCategoryLabel = selectedCategory ? getCategoryPathLabel(categories, selectedCategory) : '';

    return (
        <div className="relative flex-1" ref={dropdownRef}>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsCategoryPickerOpen(true)}
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                            <FaFilter className="text-[9px]" />
                            Chọn danh mục
                        </button>
                        {selectedCategory ? (
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('')}
                                className="text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
                            >
                                Xóa lọc
                            </button>
                        ) : null}
                    </div>
                    <div className="min-h-[2.25rem] rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/30 px-3 py-2">
                        {selectedCategory ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Đang lọc:</span>
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 truncate" title={selectedCategoryLabel}>
                                    {selectedCategoryLabel}
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Chưa chọn danh mục</p>
                        )}
                    </div>
                </div>

                {/* Input Search */}
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder={placeholder || "Tìm thuốc (theo tên, hoạt chất...)"}
                        className="w-full px-10 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                    />
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    {isLoading && (
                        <FaSpinner className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin text-sm" />
                    )}
                </div>
            </div>

            {isOpen && (query.trim() !== '' || selectedCategory !== '') && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2.5 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex items-center gap-2">
                        <FaFilter className="text-[10px] text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            {selectedCategory ? `Trong: ${selectedCategoryLabel}` : 'Kết quả tìm kiếm'}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="p-10 text-center">
                            <FaSpinner className="mx-auto text-indigo-500 animate-spin text-xl mb-2" />
                            <p className="text-sm text-gray-500">Đang tìm dữ liệu mới nhất...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="p-1.5">
                            {results.map((option) => {
                                const isOutOfStock = option.availableQuantity === 0;
                                return (
                                    <div
                                        key={option.value}
                                        className={`w-full px-4 py-3 rounded-xl flex items-start justify-between gap-4 transition-all group ${
                                            isOutOfStock ? 'opacity-60 grayscale-[0.5]' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                                    {option.productName}
                                                </p>
                                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded uppercase tracking-tighter">
                                                    {option.unit}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                                                {option.variantName}
                                            </p>
                                            
                                            <div className="flex items-center gap-3 mt-1.5">
                                                {option.sku && (
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                        <FaTag className="text-[8px]" />
                                                        <span>{option.sku}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                                    <FaBox className="text-[8px] text-gray-300" />
                                                    {isOutOfStock ? (
                                                        <span className="text-red-500 flex items-center gap-0.5">
                                                            <FaExclamationTriangle className="text-[8px]" /> Hết hàng
                                                        </span>
                                                    ) : (
                                                        <span className="text-emerald-600 flex items-center gap-0.5">
                                                            <FaCheckCircle className="text-[8px]" /> Còn {option.availableQuantity} {option.unit}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <p className="text-sm font-black text-gray-900 dark:text-white">
                                                {option.salePrice ? `${option.salePrice.toLocaleString('vi-VN')}đ` : '—'}
                                            </p>
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    if (!isOutOfStock) handleSelect(option);
                                                }}
                                                disabled={isOutOfStock}
                                                className={`px-4 py-1.5 text-[10px] font-black rounded-lg shadow-sm transition-all transform active:scale-95 ${
                                                    isOutOfStock 
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                }`}
                                            >
                                                {isOutOfStock ? 'Hết hàng' : '+ Chọn'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-10 text-center">
                            <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FaSearch className="text-gray-300 text-xl" />
                            </div>
                            <p className="text-sm text-gray-500 font-bold">Không tìm thấy biến thể nào.</p>
                            <p className="text-xs text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác.</p>
                        </div>
                    )}
                </div>
            )}

            <CategoryDrilldownModal
                isOpen={isCategoryPickerOpen}
                categories={categories}
                selectedSlug={selectedCategory}
                onClose={() => setIsCategoryPickerOpen(false)}
                onClear={() => setSelectedCategory('')}
                onSelect={(slug) => {
                    setSelectedCategory(slug);
                    setIsCategoryPickerOpen(false);
                    setIsOpen(true);
                }}
                title="Cấp 1"
                description="Chọn danh mục để đi xuống cấp tiếp theo, hoặc bấm Chọn để dùng ngay."
                tone="indigo"
            />
        </div>
    );
}
