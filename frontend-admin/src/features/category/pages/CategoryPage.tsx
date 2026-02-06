import { useEffect, useState } from "react";
import { Category } from "../types/domain";
import CategoryTable from "../components/CategoryTable";
import CategoryModal from "../components/CategoryModal";
import CategoryHeader from "../components/CategoryHeader";
import { ConfirmDialog } from "../../../shared/components";
import { useCategoryList, useCategoryActions, useCategoryAll } from "../hooks/useCategory";
import { SearchFilter, Pagination } from "../../../shared/components/ui";
import { resolveApiErrorMessage } from "../../../shared/services/apiError";

const CategoryPage = () => {
    const { categories, error: listError, refresh, search, setSearch, level, setLevel, isActive, setIsActive, pagination, setPage } = useCategoryList();
    const { categories: allCategories, fetchAll } = useCategoryAll();
    const { createCategory, updateCategory, removeCategory, error: actionError } = useCategoryActions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    // Error popup state
    const [isErrorOpen, setIsErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const openCreateModal = () => {
        setModalMode("create");
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setModalMode("edit");
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleLevelChange = (value: string) => {
        setLevel(value === "all" ? undefined : parseInt(value));
    };

    const handleActiveChange = (value: string) => {
        setIsActive(value === "all" ? undefined : value === "true");
    };

    const handleSave = async (data: Category) => {
        try {
            if (modalMode === "create") {
                await createCategory(data);
                setIsModalOpen(false);
                await fetchAll();
                await refresh(1, pagination.size, search, level, isActive);
            } else if (modalMode === "edit" && editingCategory) {
                await updateCategory(data);
                setIsModalOpen(false);
                await fetchAll();
                await refresh(pagination.page, pagination.size, search, level, isActive);
            }
        } catch (error: any) {
            const apiMessage = resolveApiErrorMessage(error, "Đã xảy ra lỗi khi lưu danh mục.");
            setErrorMessage(apiMessage);
            setIsErrorOpen(true);
        }
    };

    const openDeleteDialog = (category: Category) => {
        setDeletingCategory(category);
        setIsDeleteOpen(true);
    };

    const cancelDelete = () => {
        setIsDeleteOpen(false);
        setDeletingCategory(null);
    };

    const confirmDelete = async () => {
        try {
            if (deletingCategory) {
                await removeCategory(deletingCategory.id);
                await fetchAll();
                await refresh(pagination.page, pagination.size, search, level, isActive);
            }
        } catch (error: any) {
            const apiMessage = resolveApiErrorMessage(error, "Đã xảy ra lỗi khi xóa danh mục.");
            setErrorMessage(apiMessage);
            setIsErrorOpen(true);
        }
        setIsDeleteOpen(false);
        setDeletingCategory(null);
    };

    // Handle errors from list or actions
    useEffect(() => {
        if (listError || actionError) {
            const error = listError || actionError;
            setErrorMessage(resolveApiErrorMessage(error, "Đã xảy ra lỗi."));
            setIsErrorOpen(true);
        }
    }, [listError, actionError]);

    const filters = [
        {
            key: "level",
            label: "Mọi cấp độ",
            value: level?.toString() || "all",
            onChange: handleLevelChange,
            options: [
                { label: "Cấp 1", value: "1" },
                { label: "Cấp 2", value: "2" },
                { label: "Cấp 3", value: "3" },
            ],
        },
        {
            key: "active",
            label: "Mọi trạng thái",
            value: isActive === undefined ? "all" : isActive.toString(),
            onChange: handleActiveChange,
            options: [
                { label: "Hoạt động", value: "true" },
                { label: "Đang ẩn", value: "false" },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <CategoryHeader onAdd={openCreateModal} />

            <SearchFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm danh mục theo tên, mã..."
                onClear={() => {
                    setSearch('');
                    setLevel(undefined);
                    setIsActive(undefined);
                }}
                filters={filters}
                accentColor="emerald"
                className="border-emerald-50 focus-within:ring-emerald-100"
            />

            <CategoryTable categories={categories} onEdit={openEditModal} onDelete={openDeleteDialog} />

            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                totalElements={pagination.totalElements}
                pageSize={pagination.size}
            />

            <CategoryModal
                isOpen={isModalOpen}
                mode={modalMode}
                initialData={editingCategory ?? undefined}
                categories={allCategories}
                onClose={closeModal}
                onSave={handleSave}
            />

            <ConfirmDialog
                isOpen={isDeleteOpen}
                title="Xác nhận xóa danh mục"
                message={`Bạn có chắc chắn muốn xóa danh mục "${deletingCategory?.name}" không?`}
                onCancel={cancelDelete}
                onConfirm={confirmDelete}
                confirmLabel="Xác nhận xóa"
                cancelLabel="Hủy bỏ"
                isDangerous={true}
            />

            {/* Error Popup */}
            {isErrorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsErrorOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-base font-semibold text-gray-900">Lỗi tải danh mục</h3>
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{errorMessage}</p>
                        <div className="mt-6 flex items-center justify-end">
                            <button onClick={() => setIsErrorOpen(false)} className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryPage;
