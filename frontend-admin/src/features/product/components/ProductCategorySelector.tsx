import { useMemo, useState } from "react";
import { Category } from "../../category/types/domain";

interface ProductCategorySelectorProps {
    allCategories: Category[];
    selectedCategoryIds: string[];
    onToggleCategory: (categoryId: string) => void;
    isLoading: boolean;
}

const ProductCategorySelector = ({
    allCategories,
    selectedCategoryIds,
    onToggleCategory,
    isLoading,
}: ProductCategorySelectorProps) => {
    const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>({});
    const [categorySearch, setCategorySearch] = useState("");

    const getChildren = (parentId: string) => allCategories.filter((c) => c.parentId === parentId);
    const hasChildren = (parentId: string) => allCategories.some((c) => c.parentId === parentId);
    const matchesSearch = (name: string) => !categorySearch || name.toLowerCase().includes(categorySearch.toLowerCase());

    const l1Categories = useMemo(
        () => allCategories.filter((c) => !c.parentId || c.level === 1),
        [allCategories]
    );

    const filteredL1 = useMemo(
        () =>
            categorySearch
                ? l1Categories.filter((l1) => {
                    if (matchesSearch(l1.name || "")) return true;
                    const kids = getChildren(l1.id!);
                    return kids.some((k) => matchesSearch(k.name || "") || getChildren(k.id!).some((gc) => matchesSearch(gc.name || "")));
                })
                : l1Categories,
        [categorySearch, l1Categories]
    );

    const selectedCategories = useMemo(
        () => allCategories.filter((c) => c.id && selectedCategoryIds.includes(c.id)),
        [allCategories, selectedCategoryIds]
    );

    const renderSubItems = (parentId: string, depth: number) => {
        const kids = getChildren(parentId).filter((c) =>
            categorySearch ? matchesSearch(c.name || "") || getChildren(c.id!).some((gc) => matchesSearch(gc.name || "")) : true
        );
        if (kids.length === 0) return null;
        return (
            <div className={`space-y-0.5 ${depth === 1 ? "mt-1" : "ml-5 mt-0.5"}`}>
                {kids.map((child) => {
                    const isChecked = !!child.id && selectedCategoryIds.includes(child.id);
                    const grandKids = getChildren(child.id!);
                    return (
                        <div key={child.id}>
                            <label className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ${isChecked ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                    checked={isChecked}
                                    onChange={() => onToggleCategory(child.id!)}
                                />
                                {depth > 1 && <span className="text-gray-300 text-xs">└</span>}
                                {child.name}
                            </label>
                            {grandKids.length > 0 && renderSubItems(child.id!, depth + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="🔍 Tìm danh mục..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((cat) => (
                        <span key={cat.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                            {cat.name}
                            <button type="button" onClick={() => onToggleCategory(cat.id!)} className="hover:text-red-500 transition-colors">×</button>
                        </span>
                    ))}
                </div>
            )}
            {isLoading ? (
                <div className="text-center text-gray-400 italic py-8">Đang tải danh mục...</div>
            ) : filteredL1.length === 0 ? (
                <div className="text-center text-gray-400 italic py-8">Không tìm thấy danh mục phù hợp</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredL1.map((l1) => {
                        const isOpen = expandedL1[l1.id!] || !!categorySearch;
                        const isChecked = !!l1.id && selectedCategoryIds.includes(l1.id);
                        const childCount = getChildren(l1.id!).length;
                        return (
                            <div key={l1.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                <div className={`flex items-center gap-2 px-4 py-3 cursor-pointer select-none transition-colors ${isChecked ? "bg-emerald-50" : "bg-gray-50/60 hover:bg-gray-50"}`}>
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                        checked={isChecked}
                                        onChange={() => onToggleCategory(l1.id!)}
                                    />
                                    <button type="button" onClick={() => setExpandedL1((prev) => ({ ...prev, [l1.id!]: !prev[l1.id!] }))} className="flex-1 flex items-center justify-between text-left">
                                        <span className={`text-sm font-bold ${isChecked ? "text-emerald-800" : "text-gray-800"}`}>{l1.name}</span>
                                        {hasChildren(l1.id!) && (
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-gray-400 font-medium">{childCount}</span>
                                            </span>
                                        )}
                                    </button>
                                </div>
                                {isOpen && hasChildren(l1.id!) && (
                                    <div className="px-3 py-2 border-t border-gray-50 bg-white">
                                        {renderSubItems(l1.id!, 1)}
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

export default ProductCategorySelector;
