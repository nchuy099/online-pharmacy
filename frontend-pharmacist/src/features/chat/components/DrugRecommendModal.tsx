import { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaPlus, FaMinus, FaShoppingCart, FaSpinner, FaBox, FaTag } from 'react-icons/fa';
import { chatService } from '../services/chat.service';
import { chatApi } from '../api/chat.api';
import type { ProductSearchOption, DrugRecommendation } from '../types/domain';
import type { CategoryDTO } from '../types/dto';
import CategoryDrilldownModal from './CategoryDrilldownModal';
import { getCategoryPathLabel } from './categoryTree';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (items: DrugRecommendation[]) => void;
}

export default function DrugRecommendModal({ isOpen, onClose, onSubmit }: Props) {
    const [query, setQuery] = useState('');
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [results, setResults] = useState<ProductSearchOption[]>([]);
    const [selected, setSelected] = useState<DrugRecommendation[]>([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

    useEffect(() => {
        chatApi.getCategories().then(setCategories).catch(console.error);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!selectedCategory && query.trim().length < 2) {
                setResults([]);
                setHasSearched(false);
                return;
            }
            setSearching(true);
            setHasSearched(true);
            try {
                const items = await chatService.searchProducts(query, selectedCategory);
                setResults(items);
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [query, selectedCategory]);

    const addItem = (option: ProductSearchOption) => {
        setSelected(prev => {
            const existing = prev.find(s => s.variantId === option.value);
            if (existing) {
                return prev.map(s => s.variantId === option.value ? { ...s, quantity: s.quantity + 1 } : s);
            }
            return [...prev, {
                productId: option.productId,
                variantId: option.value,
                productName: option.productName,
                variantName: option.variantName,
                unit: option.unit,
                salePrice: option.salePrice || 0,
                availableQuantity: option.availableQuantity || 0,
                primaryImage: option.primaryImage || null,
                quantity: 1
            }];
        });
    };

    const removeItem = (variantId: string) => {
        setSelected(prev => prev.filter(s => s.variantId !== variantId));
    };

    const updateQty = (variantId: string, delta: number) => {
        setSelected(prev => prev.map(s => {
            if (s.variantId !== variantId) return s;
            const newQty = Math.max(1, s.quantity + delta);
            return { ...s, quantity: newQty };
        }));
    };

    const handleSubmit = () => {
        if (selected.length === 0) return;
        onSubmit(selected);
        handleClose();
    };

    const handleClose = () => {
        setQuery('');
        setResults([]);
        setSelected([]);
        setSelectedCategory('');
        setIsCategoryPickerOpen(false);
        onClose();
    };

    const selectedCategoryLabel = selectedCategory ? getCategoryPathLabel(categories, selectedCategory) : '';

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    const getLineTotal = (item: DrugRecommendation) => (item.salePrice || 0) * item.quantity;
    const grandTotal = selected.reduce((acc, s) => acc + getLineTotal(s), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                <div className="bg-gradient-to-r from-teal-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                        <FaShoppingCart size={12} /> Đề xuất thuốc (Variant-aware)
                    </h2>
                    <button onClick={handleClose} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
                        <FaTimes className="text-xs" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Gõ tên thuốc hoặc hoạt chất..."
                            className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm transition-all"
                            autoFocus
                        />
                        {searching ? (
                            <FaSpinner className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 animate-spin text-xs" />
                        ) : (
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCategoryPickerOpen(true)}
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                            >
                                <FaTag className="text-[9px]" />
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
                                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300 truncate" title={selectedCategoryLabel}>
                                        {selectedCategoryLabel}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic">Chưa chọn danh mục</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50 bg-white dark:bg-gray-800 p-2">
                    {searching && results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <FaSpinner className="text-3xl text-teal-500 animate-spin mb-4" />
                            <p className="text-sm text-gray-400 font-medium">Đang tìm biến thể thuốc...</p>
                        </div>
                    ) : !hasSearched ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mb-4">
                                <FaSearch className="text-2xl text-teal-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Chọn đúng biến thể để đề xuất</p>
                            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Dược sĩ nên ưu tiên biến thể còn hàng và đúng quy cách</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <p className="text-sm text-gray-400 font-bold uppercase">Không tìm thấy sản phẩm</p>
                            <p className="text-xs text-gray-400 mt-1">Thử từ khóa khác hoặc đổi danh mục</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {selectedCategory && selectedCategoryLabel && (
                                <div className="px-4 pt-2">
                                    <div className="flex items-center gap-1.5">
                                        <FaTag className="text-[9px] text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            {selectedCategoryLabel} — {results.length} kết quả
                                        </span>
                                    </div>
                                </div>
                            )}
                            {results.map(option => {
                                const isAdded = selected.some(s => s.variantId === option.value);
                                const isOutOfStock = option.availableQuantity === 0;
                                return (
                                    <div key={option.value} className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all group ${isOutOfStock ? 'opacity-60' : 'hover:bg-teal-50/50 dark:hover:bg-teal-900/10'}`}>
                                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                                            {option.primaryImage ? (
                                                <img src={option.primaryImage} alt={option.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-bold">No Img</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{option.productName}</p>
                                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[9px] font-black rounded uppercase">{option.unit}</span>
                                            </div>
                                            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5 truncate uppercase tracking-tighter">{option.variantName}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                                    <FaBox size={8} />
                                                    {isOutOfStock ? <span className="text-red-500">Hết hàng</span> : <span>Tồn: {option.availableQuantity}</span>}
                                                </div>
                                                {option.sku && (
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                        <FaTag size={8} /> <span>{option.sku}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className="text-sm font-black text-emerald-600">{formatPrice(option.salePrice || 0)}</span>
                                            <button
                                                onClick={() => !isOutOfStock && addItem(option)}
                                                disabled={isOutOfStock}
                                                className={`px-4 py-1.5 text-[10px] font-black rounded-xl transition-all active:scale-95 border-2 ${
                                                    isAdded
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 shadow-lg'
                                                    : isOutOfStock
                                                    ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                                                    : 'bg-white dark:bg-gray-800 text-teal-600 border-teal-50 dark:border-teal-900/30 hover:border-teal-400 shadow-sm'
                                                }`}
                                            >
                                                {isAdded ? '✓ ĐÃ THÊM' : isOutOfStock ? 'HẾT HÀNG' : 'THÊM'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <CategoryDrilldownModal
                    isOpen={isCategoryPickerOpen}
                    categories={categories}
                    selectedSlug={selectedCategory}
                    onClose={() => setIsCategoryPickerOpen(false)}
                    onClear={() => setSelectedCategory('')}
                    onSelect={(slug) => {
                        setSelectedCategory(slug);
                        setIsCategoryPickerOpen(false);
                    }}
                    title="Cấp 1"
                    description="Chọn danh mục để đi xuống cấp tiếp theo, hoặc bấm Chọn để dùng ngay."
                    tone="teal"
                />

                {selected.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900/80 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <FaShoppingCart size={10} /> Đã chọn ({selected.length})
                            </p>
                            <span className="text-xs font-black text-emerald-600">Tổng: {formatPrice(grandTotal)}</span>
                        </div>
                        <div className="space-y-2 mb-5 max-h-44 overflow-y-auto pr-1 no-scrollbar">
                            {selected.map(item => (
                                <div key={item.variantId} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-gray-700 shadow-sm gap-3">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                                        {item.primaryImage ? (
                                            <img src={item.primaryImage} alt={item.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px] font-bold">No Img</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate leading-none">{item.productName}</p>
                                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase truncate">{item.variantName}</p>
                                        <div className="mt-1 flex items-center gap-3 text-[10px] font-bold">
                                            <span className="text-gray-500">Đơn giá: <span className="text-emerald-600">{formatPrice(item.salePrice || 0)}</span></span>
                                            <span className="text-gray-500">Thành tiền: <span className="text-blue-600">{formatPrice(getLineTotal(item))}</span></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        <button onClick={() => updateQty(item.variantId, -1)} className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                            <FaMinus className="text-[8px]" />
                                        </button>
                                        <span className="text-xs font-black text-gray-900 dark:text-white w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.variantId, 1)} className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                            <FaPlus className="text-[8px]" />
                                        </button>
                                        <button onClick={() => removeItem(item.variantId)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors ml-1">
                                            <FaTimes className="text-[8px]" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSubmit}
                                className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-teal-500/20"
                            >
                                <FaShoppingCart size={12} /> Gửi đề xuất thuốc
                            </button>
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-black uppercase tracking-widest rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-all"
                            >
                                Huỷ
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
