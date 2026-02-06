import { useEffect, useState } from "react";
import { notificationBus } from "../../notification";
import { useCategoryAll } from "../../category/hooks/useCategory";
import { useProductActions } from "../hooks/useProduct";
import ProductCategorySelector from "./ProductCategorySelector";

interface ProductCategoryEditDialogProps {
    productId?: string;
    initialCategoryIds: string[];
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
    onSaveLocal?: (categoryIds: string[]) => void | Promise<void>;
    title?: string;
    saveLabel?: string;
}

const ProductCategoryEditDialog = ({
    productId,
    initialCategoryIds,
    isOpen,
    onClose,
    onSaved,
    onSaveLocal,
    title,
    saveLabel,
}: ProductCategoryEditDialogProps) => {
    const { categories: allCategories, isLoading: isCategoriesLoading } = useCategoryAll();
    const { updateProductCategories, isLoading } = useProductActions();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setSelectedIds(initialCategoryIds);
        setErrorMessage(null);
    }, [initialCategoryIds, isOpen]);

    const getAncestorIds = (catId: string): string[] => {
        const ids: string[] = [];
        let current = allCategories.find((c) => c.id === catId);
        while (current?.parentId) {
            ids.push(current.parentId);
            current = allCategories.find((c) => c.id === current?.parentId);
        }
        return ids;
    };

    const getDescendantIds = (catId: string): string[] => {
        const ids: string[] = [];
        const children = allCategories.filter((c) => c.parentId === catId);
        for (const child of children) {
            if (child.id) {
                ids.push(child.id);
                ids.push(...getDescendantIds(child.id));
            }
        }
        return ids;
    };

    const handleToggleCategory = (categoryId: string) => {
        setSelectedIds((prev) => {
            const list = [...prev];
            const index = list.indexOf(categoryId);
            if (index > -1) {
                list.splice(index, 1);
                const descendantIds = getDescendantIds(categoryId);
                for (const id of descendantIds) {
                    const idx = list.indexOf(id);
                    if (idx > -1) list.splice(idx, 1);
                }
            } else {
                list.push(categoryId);
                const ancestorIds = getAncestorIds(categoryId);
                for (const id of ancestorIds) {
                    if (!list.includes(id)) list.push(id);
                }
            }
            return list;
        });
    };


    const handleSave = async () => {
        setErrorMessage(null);
        if (selectedIds.length === 0) {
            setErrorMessage("Vui lòng chọn ít nhất một phân loại.");
            return;
        }
        try {
            if (onSaveLocal) {
                await onSaveLocal(selectedIds);
            } else if (productId) {
                await updateProductCategories(productId, { categoryIds: selectedIds });
                notificationBus.success("Cập nhật phân loại thành công");
            } else {
                setErrorMessage("Thiếu thông tin sản phẩm để cập nhật.");
                return;
            }
            onSaved?.();
            onClose();
        } catch (error: any) {
            setErrorMessage(error?.message || "Không thể cập nhật phân loại");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{title || "Sửa phân loại sản phẩm"}</h3>
                        <p className="text-xs text-gray-500 mt-1">Đã chọn {selectedIds.length} danh mục</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-auto">
                    <ProductCategorySelector
                        allCategories={allCategories}
                        selectedCategoryIds={selectedIds}
                        onToggleCategory={handleToggleCategory}
                        isLoading={isCategoriesLoading}
                    />
                    {errorMessage && <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{errorMessage}</div>}
                </div>

                <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100">
                        Huy
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading || isCategoriesLoading}
                        className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {isLoading ? "Dang cap nhat..." : (saveLabel || "Luu phan loai")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCategoryEditDialog;
