import { useState, useRef } from 'react';
import { FaTimes, FaFilePrescription, FaTrash, FaCalendarAlt, FaSearch, FaSpinner, FaFilter, FaPills, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { PrescriptionRequest} from '../types/patient';
import type { CustomerInfo } from '../types/domain';
import type { ProductVariantDTO, CategoryDTO } from '../types/dto';
import { chatApi } from '../api/chat.api';
import { formatDate } from '../../../shared/utils/dateUtils';
import { useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PrescriptionItem {
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unit: string;
    primaryImage?: string;
    producer?: string;
    price?: number;
    quantity: number;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    customer: CustomerInfo | null;
    onSubmit: (request: PrescriptionRequest) => void;
    isSubmitting: boolean;
}

const CATEGORY_TARGET_LEVEL = 3;

const findCategoryTrailBySlug = (categories: CategoryDTO[], slug: string): CategoryDTO[] | null => {
    if (!slug) return [];

    const trail: CategoryDTO[] = [];
    const dfs = (nodes: CategoryDTO[]): boolean => {
        for (const node of nodes) {
            if (node.slug === slug) {
                return true;
            }

            trail.push(node);
            if (node.children?.length && dfs(node.children)) {
                return true;
            }
            trail.pop();
        }
        return false;
    };

    return dfs(categories) ? [...trail] : null;
};

const findCategoryBySlug = (categories: CategoryDTO[], slug: string): CategoryDTO | null => {
    for (const category of categories) {
        if (category.slug === slug) {
            return category;
        }
        const found = category.children?.length ? findCategoryBySlug(category.children, slug) : null;
        if (found) return found;
    }
    return null;
};

const getCategoryPathLabel = (categories: CategoryDTO[], slug: string): string => {
    if (!slug) return '';

    const path = findCategoryTrailBySlug(categories, slug);
    if (path === null) return '';

    const current = findCategoryBySlug(categories, slug);
    return [...path, ...(current ? [current] : [])].map((category) => category.name).join(' / ');
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreatePrescriptionModal({ isOpen, onClose, customer, onSubmit, isSubmitting }: Props) {
    const [diagnosis, setDiagnosis] = useState('');
    const [generalInstructions, setGeneralInstructions] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [items, setItems] = useState<PrescriptionItem[]>([]);
    const [showErrors, setShowErrors] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setDiagnosis('');
        setGeneralInstructions('');
        setFollowUpDate('');
        setItems([]);
        setShowErrors(false);
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    if (!isOpen || !customer) return null;

    const handleSubmit = () => {
        setShowErrors(true);
        if (!diagnosis.trim() || items.length === 0) return;
        const missingInstructions = items.some(i => !i.instructions.trim());
        if (missingInstructions) return;
        onSubmit({
            customerId: customer.id,
            diagnosis,
            generalInstructions,
            followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
            items: items.map(({ productId, variantId, productName, variantName, unit, quantity, dosage, frequency, duration, instructions }) => ({
                productId,
                variantId,
                productName,
                variantName,
                unit,
                quantity,
                dosage,
                frequency,
                duration,
                instructions
            }))
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const addProduct = (variant: ProductVariantDTO) => {
        const existing = items.findIndex(i => i.variantId === variant.variantId);
        if (existing >= 0) {
            setItems(prev => prev.map((item, idx) =>
                idx === existing ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setItems(prev => [...prev, {
                productId: variant.productId,
                variantId: variant.variantId,
                productName: variant.productName,
                variantName: variant.variantName,
                unit: variant.unit,
                primaryImage: variant.primaryImage || undefined,
                producer: variant.specification || '',
                price: variant.salePrice || 0,
                quantity: 1,
                dosage: '',
                frequency: '',
                duration: '',
                instructions: '',
            }]);
        }
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, updates: Partial<PrescriptionItem>) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
    };

    const missingInstructionsCount = items.filter(i => !i.instructions.trim()).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-600 to-violet-600">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FaFilePrescription /> Kê Đơn Thuốc — {customer.name}
                    </h2>
                    <button onClick={handleClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                        <FaTimes />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Top section: Diagnosis */}
                    <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Chẩn đoán <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                            placeholder="Nhập chẩn đoán lâm sàng..."
                        />
                    </div>

                    {/* Main 2-column layout */}
                    <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
                        {/* LEFT: Search Panel */}
                        <div className="flex flex-col overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <FaSearch className="text-indigo-500" /> Tìm kiếm thuốc
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <ProductSearchPanel onAddProduct={addProduct} addedIds={items.map(i => i.productId)} />
                            </div>
                        </div>

                        {/* RIGHT: Prescription Items Panel */}
                        <div className="flex flex-col overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <FaPills className="text-indigo-500" /> Đơn thuốc
                                </p>
                                {items.length > 0 && (
                                    <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                        {items.length} loại
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                                            <FaPills className="text-2xl text-gray-300 dark:text-gray-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Chưa có thuốc nào</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Tìm và thêm thuốc từ bảng bên trái</p>
                                    </div>
                                ) : (
                                    items.map((item, index) => (
                                        <div key={item.productId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                            {/* Product info row */}
                                            <div className="flex items-center gap-3 p-3 border-b border-gray-50 dark:border-gray-700">
                                                {item.primaryImage ? (
                                                    <img src={item.primaryImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                                        <FaPills className="text-indigo-300" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">{item.productName}</p>
                                                    {item.producer && <p className="text-[10px] text-gray-400 italic mt-0.5">{item.producer}</p>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </div>
                                            {/* Controls row */}
                                            <div className="p-3 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Số lượng</label>
                                                    <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateItem(index, { quantity: Math.max(1, item.quantity - 1) })}
                                                            className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm font-bold transition-colors"
                                                        >−</button>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                                            className="w-12 text-center py-1.5 text-sm font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none border-x border-gray-200 dark:border-gray-600"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateItem(index, { quantity: item.quantity + 1 })}
                                                            className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm font-bold transition-colors"
                                                        >+</button>
                                                    </div>
                                                    {item.price && (
                                                        <span className="ml-auto text-xs font-bold text-emerald-600">
                                                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Cách dùng, liều lượng... *"
                                                    value={item.instructions}
                                                    onChange={(e) => updateItem(index, { instructions: e.target.value })}
                                                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-all ${
                                                        showErrors && !item.instructions.trim()
                                                            ? 'border-red-400 bg-red-50 dark:bg-red-900/10 dark:border-red-700 placeholder-red-400 ring-1 ring-red-400'
                                                            : !item.instructions.trim()
                                                                ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700 placeholder-amber-400'
                                                                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white'
                                                    }`}
                                                />
                                                {showErrors && !item.instructions.trim() && (
                                                    <p className="text-[10px] text-red-500 font-medium mt-1">⚠ Bắt buộc điền cách dùng</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom section: Notes + Follow-up */}
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Dặn dò chung</label>
                            <textarea
                                value={generalInstructions}
                                onChange={(e) => setGeneralInstructions(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                placeholder="Lời dặn dò về dinh dưỡng, sinh hoạt..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Ngày tái khám</label>
                            <div className="relative cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}>
                                <input
                                    type="text"
                                    readOnly
                                    value={formatDate(followUpDate)}
                                    placeholder="dd/mm/yyyy"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                                />
                                <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    value={followUpDate}
                                    onChange={(e) => setFollowUpDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 pointer-events-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 bg-white dark:bg-gray-900">
                    <p className={`text-xs font-medium ${showErrors && missingInstructionsCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {!diagnosis.trim()
                            ? '⚠ Cần nhập chẩn đoán'
                            : items.length === 0
                                ? 'Cần thêm ít nhất 1 loại thuốc'
                                : showErrors && missingInstructionsCount > 0
                                    ? `⚠ Còn ${missingInstructionsCount} thuốc chưa điền cách dùng`
                                    : `${items.length} loại thuốc đã được thêm`}
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2"><FaSpinner className="animate-spin" /> Đang lưu...</span>
                            ) : (
                                'Lưu Đơn Thuốc'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Product Search Panel (Left Column) ──────────────────────────────────────
function ProductSearchPanel({ onAddProduct, addedIds }: { onAddProduct: (v: ProductVariantDTO) => void; addedIds: string[] }) {
    const [query, setQuery] = useState('');
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [results, setResults] = useState<ProductVariantDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
    const [categoryTrail, setCategoryTrail] = useState<CategoryDTO[]>([]);

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
            setIsLoading(true);
            setHasSearched(true);
            try {
                const data = await chatApi.searchProducts(query, selectedCategory);
                setResults(data.products || []);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [query, selectedCategory]);

    const openCategoryPicker = () => {
        const trail = selectedCategory ? findCategoryTrailBySlug(categories, selectedCategory) : [];
        setCategoryTrail(trail ?? []);
        setIsCategoryPickerOpen(true);
    };

    const closeCategoryPicker = () => {
        setIsCategoryPickerOpen(false);
    };

    const clearCategorySelection = () => {
        setSelectedCategory('');
        setCategoryTrail([]);
        setIsCategoryPickerOpen(false);
    };

    const goBackCategoryLevel = () => {
        setCategoryTrail(prev => prev.slice(0, -1));
    };

    const handleCategorySelect = (category: CategoryDTO) => {
        setSelectedCategory(category.slug);
        setIsCategoryPickerOpen(false);
    };

    const handleCategoryNavigate = (category: CategoryDTO) => {
        const canDrillDown = (category.children?.length ?? 0) > 0 && category.level < CATEGORY_TARGET_LEVEL;
        if (canDrillDown) {
            setCategoryTrail(prev => [...prev, category]);
            return;
        }
        handleCategorySelect(category);
    };

    const currentParent = categoryTrail.length > 0 ? categoryTrail[categoryTrail.length - 1] : null;
    const visibleCategories = currentParent ? (currentParent.children ?? []) : categories;
    const currentLevel = categoryTrail.length + 1;
    const selectedCategoryLabel = selectedCategory ? getCategoryPathLabel(categories, selectedCategory) : '';

    return (
        <div className="flex flex-col h-full">
            {/* Search Input */}
            <div className="p-4 space-y-3 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Gõ tên thuốc để tìm kiếm..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                        {isLoading
                        ? <FaSpinner className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin text-sm" />
                        : <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    }
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={openCategoryPicker}
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                            <FaFilter className="text-[9px]" />
                            Chọn danh mục
                        </button>
                        {selectedCategory ? (
                            <button
                                type="button"
                                onClick={clearCategorySelection}
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
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FaSpinner className="text-2xl text-indigo-400 animate-spin mb-3" />
                        <p className="text-sm text-gray-400">Đang tìm kiếm...</p>
                    </div>
                ) : !hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-4">
                            <FaSearch className="text-xl text-indigo-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Tìm thuốc bằng tên</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">hoặc chọn danh mục để xem danh sách</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-sm text-gray-400 font-medium">Không tìm thấy kết quả</p>
                        <p className="text-xs text-gray-400 mt-1">Thử từ khóa khác hoặc đổi danh mục</p>
                    </div>
                ) : (
                    <div className="p-3 space-y-2">
                        {selectedCategory && selectedCategoryLabel && (
                            <div className="flex items-center gap-1.5 px-1 mb-1">
                                <FaFilter className="text-[9px] text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {selectedCategoryLabel} — {results.length} kết quả
                                </span>
                            </div>
                        )}
                        {results.map(variant => {
                            const isAdded = addedIds.includes(variant.variantId);
                            return (
                                <div key={variant.variantId} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isAdded ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700'}`}>
                                    {variant.primaryImage ? (
                                        <img src={variant.primaryImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                            <FaPills className="text-indigo-300 text-sm" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">{variant.productName}</p>
                                        <div className="flex flex-col mt-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-1 rounded uppercase tracking-tighter">
                                                    {variant.variantName}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{variant.unit}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {variant.specification && <span className="text-[9px] text-gray-400 italic truncate">{variant.specification}</span>}
                                                <span className="text-[10px] font-bold text-emerald-600 whitespace-nowrap">{(variant.salePrice || 0).toLocaleString('vi-VN')}đ</span>
                                                <span className={`text-[9px] font-bold ${(variant.availableQuantity || 0) > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                                    Kho: {variant.availableQuantity || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); onAddProduct(variant); }}
                                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${isAdded ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95'}`}
                                    >
                                        {isAdded ? '✓' : <FaPlus className="text-xs" />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isCategoryPickerOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={closeCategoryPicker}
                >
                    <div
                        className="w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3 bg-gradient-to-r from-indigo-600 to-violet-600">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Danh mục thuốc</p>
                                <h3 className="text-lg font-black text-white mt-1">
                                    {currentParent ? currentParent.name : 'Cấp 1'}
                                </h3>
                                <p className="text-xs text-white/70 mt-1">
                                    Chọn một danh mục để đi xuống cấp tiếp theo, hoặc bấm Chọn để dùng ngay.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {categoryTrail.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={goBackCategoryLevel}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-[10px] font-black uppercase tracking-wider hover:bg-white/20 transition-colors"
                                    >
                                        <FaChevronLeft className="text-[9px]" />
                                        Quay lại
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={closeCategoryPicker}
                                    className="w-9 h-9 rounded-xl bg-white/15 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                                >
                                    <FaTimes className="text-xs" />
                                </button>
                            </div>
                        </div>

                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cấp {currentLevel}</span>
                                {categoryTrail.length > 0 ? (
                                    categoryTrail.map((node, index) => (
                                        <button
                                            key={node.id}
                                            type="button"
                                            onClick={() => setCategoryTrail(categoryTrail.slice(0, index))}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 transition-colors"
                                        >
                                            {node.name}
                                        </button>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-500">Mở từ cấp 1</span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white dark:bg-gray-900">
                            {visibleCategories.length > 0 ? (
                                visibleCategories.map((category) => {
                                    const canDrillDown = (category.children?.length ?? 0) > 0 && category.level < CATEGORY_TARGET_LEVEL;
                                    const isSelected = selectedCategory === category.slug;
                                    return (
                                        <div
                                            key={category.id}
                                            className={`flex items-stretch gap-2 rounded-2xl border p-3 transition-all ${
                                                isSelected
                                                    ? 'border-indigo-300 bg-indigo-50/70 dark:bg-indigo-900/20 dark:border-indigo-700'
                                                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-200 dark:hover:border-indigo-700'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleCategoryNavigate(category)}
                                                className="flex-1 text-left min-w-0"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                            {category.name}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                                Cấp {category.level}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {category.productCount || 0} sản phẩm
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {canDrillDown ? (
                                                        <FaChevronRight className="text-gray-300 text-xs flex-shrink-0" />
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex-shrink-0">
                                                            Chọn
                                                        </span>
                                                    )}
                                                </div>
                                            </button>

                                            {canDrillDown && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCategorySelect(category)}
                                                    className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors flex-shrink-0"
                                                >
                                                    Chọn
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                                        <FaFilter className="text-gray-300 text-lg" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-500">Không còn danh mục con</p>
                                    <p className="text-xs text-gray-400 mt-1">Bạn có thể quay lại hoặc chọn danh mục hiện tại.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
