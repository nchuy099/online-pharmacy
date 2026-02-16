import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaFilter, FaTimes } from "react-icons/fa";
import type { CategoryDTO } from "../types/dto";
import { findCategoryTrailBySlug, getCategoryPathLabel } from "./categoryTree";

type Tone = "indigo" | "teal";

type CategoryDrilldownModalProps = {
    isOpen: boolean;
    categories: CategoryDTO[];
    selectedSlug: string;
    selectedLabel?: string;
    onClose: () => void;
    onClear: () => void;
    onSelect: (slug: string) => void;
    title: string;
    description: string;
    tone?: Tone;
};

const toneClasses: Record<Tone, {
    accent: string;
    accentSoft: string;
    accentText: string;
    accentBorder: string;
    accentBg: string;
    button: string;
}> = {
    indigo: {
        accent: "from-indigo-600 to-violet-600",
        accentSoft: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
        accentText: "text-indigo-700 dark:text-indigo-300",
        accentBorder: "border-indigo-300 bg-indigo-50/70 dark:bg-indigo-900/20 dark:border-indigo-700",
        accentBg: "bg-indigo-600 hover:bg-indigo-700",
        button: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    },
    teal: {
        accent: "from-teal-600 to-emerald-700",
        accentSoft: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
        accentText: "text-teal-700 dark:text-teal-300",
        accentBorder: "border-teal-300 bg-teal-50/70 dark:bg-teal-900/20 dark:border-teal-700",
        accentBg: "bg-teal-600 hover:bg-teal-700",
        button: "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100",
    },
};

export default function CategoryDrilldownModal({
    isOpen,
    categories,
    selectedSlug,
    selectedLabel,
    onClose,
    onClear,
    onSelect,
    title,
    description,
    tone = "indigo",
}: CategoryDrilldownModalProps) {
    const styles = toneClasses[tone];
    const [trail, setTrail] = useState<CategoryDTO[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        const selectedTrail = selectedSlug ? findCategoryTrailBySlug(categories, selectedSlug) : [];
        setTrail(selectedTrail ?? []);
    }, [categories, isOpen, selectedSlug]);

    const currentParent = trail.length > 0 ? trail[trail.length - 1] : null;
    const visibleCategories = useMemo(
        () => (currentParent ? currentParent.children ?? [] : categories),
        [categories, currentParent]
    );
    const currentLevel = trail.length + 1;

    const close = () => onClose();
    const goBack = () => setTrail((prev) => prev.slice(0, -1));
    const clear = () => {
        setTrail([]);
        onClear();
    };

    const handleNavigate = (category: CategoryDTO) => {
        const canDrillDown = (category.children?.length ?? 0) > 0 && category.level < 3;
        if (canDrillDown) {
            setTrail((prev) => [...prev, category]);
            return;
        }
        onSelect(category.slug);
    };

    if (!isOpen) return null;

    const selectedDisplayLabel = selectedLabel || getCategoryPathLabel(categories, selectedSlug);

    return (
        <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={close}>
            <div
                className="w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col"
                onClick={(event) => event.stopPropagation()}
            >
                <div className={`px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3 bg-gradient-to-r ${styles.accent}`}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Danh mục thuốc</p>
                        <h3 className="text-lg font-black text-white mt-1">{currentParent ? currentParent.name : title}</h3>
                        <p className="text-xs text-white/70 mt-1">{description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {trail.length > 0 && (
                            <button
                                type="button"
                                onClick={goBack}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-[10px] font-black uppercase tracking-wider hover:bg-white/20 transition-colors"
                            >
                                <FaChevronLeft className="text-[9px]" />
                                Quay lại
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={close}
                            className="w-9 h-9 rounded-xl bg-white/15 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                        >
                            <FaTimes className="text-xs" />
                        </button>
                    </div>
                </div>

                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cấp {currentLevel}</span>
                        {trail.length > 0 ? (
                            trail.map((node, index) => (
                                <button
                                    key={node.id}
                                    type="button"
                                    onClick={() => setTrail(trail.slice(0, index))}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${styles.button}`}
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
                            const canDrillDown = (category.children?.length ?? 0) > 0 && category.level < 3;
                            const isSelected = selectedSlug === category.slug;
                            return (
                                <div
                                    key={category.id}
                                    className={`flex items-stretch gap-2 rounded-2xl border p-3 transition-all ${
                                        isSelected ? styles.accentBorder : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-200 dark:hover:border-indigo-700"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleNavigate(category)}
                                        className="flex-1 text-left min-w-0"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{category.name}</p>
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
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${styles.accentText} flex-shrink-0`}>
                                                    Chọn
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {canDrillDown && (
                                        <button
                                            type="button"
                                            onClick={() => onSelect(category.slug)}
                                            className={`px-3 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-wider transition-colors flex-shrink-0 ${styles.accentBg}`}
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

                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Đã chọn</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                            {selectedDisplayLabel || "Chưa chọn"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={clear}
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
                        >
                            Xóa lọc
                        </button>
                        <button
                            type="button"
                            onClick={close}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-colors ${styles.accentBg}`}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
