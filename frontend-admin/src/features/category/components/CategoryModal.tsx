import { useEffect, useState } from "react";
import { FormModal, FormField } from "../../../shared/components/ui";
import { Category } from "../types/domain";


interface CategoryModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    initialData?: Partial<Category>;
    categories: Category[];
    onClose: () => void;
    onSave: (data: Category) => void | Promise<void>;
}

const CategoryModal = ({ isOpen, mode, initialData, categories, onClose, onSave }: CategoryModalProps) => {
    const [formData, setFormData] = useState<Partial<Category & { parentL1: string; parentL2: string }>>({
        id: undefined,
        name: "",
        parentId: "",
        parentL1: "",
        parentL2: "",
        level: 1,
        isActive: true,
    });

    useEffect(() => {
        if (isOpen && initialData) {
            // Determine parent hierarchy for existing category
            let l1 = "";
            let l2 = "";
            const pid = initialData.parentId;
            if (pid) {
                const parent = categories.find(c => c.id === pid);
                if (parent) {
                    if (parent.level === 1) {
                        l1 = parent.id!;
                    } else if (parent.level === 2) {
                        l2 = parent.id!;
                        l1 = parent.parentId || "";
                    } else if (parent.level === 3) {
                        // If we support L4, but mostly 3 levels. 
                        // Let's find the grandfather
                        l2 = parent.parentId || "";
                        const grandParent = categories.find(c => c.id === l2);
                        l1 = grandParent?.parentId || "";
                    }
                }
            }

            setFormData({
                id: initialData.id,
                name: initialData.name ?? "",
                parentId: initialData.parentId ?? "",
                parentL1: l1,
                parentL2: l2,
                level: initialData.level ?? 1,
                isActive: initialData.isActive ?? true,
            });
        } else if (isOpen) {
            resetForm();
        }
    }, [isOpen, initialData, categories]);

    const l1Options = categories
        .filter(c => c.level === 1 && c.id !== formData.id)
        .map(c => ({ label: c.name, value: c.id! }));

    const l2Options = formData.parentL1
        ? categories
            .filter(c => c.parentId === formData.parentL1 && c.id !== formData.id)
            .map(c => ({ label: c.name, value: c.id! }))
        : [];

    const fields: FormField<Category & { parentL1: string; parentL2: string }>[] = [
        {
            key: "name",
            label: "Tên danh mục",
            type: "text",
            placeholder: "Nhập tên danh mục",
            required: true,
        },
        {
            key: "parentL1",
            label: "Danh mục cha (Cấp 1)",
            type: "select",
            options: [{ label: "Không có", value: "" }, ...l1Options],
        },
    ];

    if (formData.parentL1 && l2Options.length > 0) {
        fields.push({
            key: "parentL2",
            label: "Danh mục cha (Cấp 2)",
            type: "select",
            options: [{ label: "Giữ ở Cấp 1", value: "" }, ...l2Options],
        });
    }

    fields.push(
        {
            key: "level",
            label: "Cấp độ hiển thị",
            type: "number",
            required: true,
            disabled: true,
        },
        {
            key: "isActive",
            label: "Trạng thái hoạt động",
            type: "checkbox",
        }
    );

    const handleDataChange = (field: string, value: any) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };

            if (field === "parentL1") {
                newData.parentL2 = "";
                newData.parentId = value;
                const parent = categories.find(c => c.id === value);
                newData.level = parent ? parent.level + 1 : 1;
            } else if (field === "parentL2") {
                newData.parentId = value || prev.parentL1;
                const parent = categories.find(c => c.id === (value || prev.parentL1));
                newData.level = parent ? parent.level + 1 : 1;
            }

            return newData;
        });
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) return;

        try {
            await onSave({
                id: formData.id,
                name: formData.name.trim(),
                parentId: formData.parentId || null,
                level: formData.level || 1,
                isActive: !!formData.isActive,
            } as Category);
            onClose();
        } catch (error) {
            console.error("Save category error:", error);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setFormData({ id: undefined, name: "", parentId: "", parentL1: "", parentL2: "", level: 1, isActive: true });
    };

    return (
        <FormModal<Category & { parentL1: string; parentL2: string }>
            isOpen={isOpen}
            mode={mode}
            titleCreate="Thêm Category"
            titleEdit="Chỉnh sửa Category"
            fields={fields}
            data={formData}
            onDataChange={handleDataChange}
            onClose={handleClose}
            onSave={handleSave}
            accentColor="emerald"
            submitLabelCreate="Lưu"
            submitLabelEdit="Cập nhật"
            cancelLabel="Hủy"
        />
    );
};

export default CategoryModal;
