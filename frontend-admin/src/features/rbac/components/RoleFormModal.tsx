import { useEffect, useState, type FormEvent } from "react";
import Modal from "../../../shared/components/ui/Modal";
import { RoleSummary } from "../types";

interface RoleFormValues {
    name: string;
    description: string;
}

interface RoleFormModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    roleType: string;
    role?: RoleSummary | null;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (values: RoleFormValues) => Promise<void> | void;
}

const emptyValues: RoleFormValues = {
    name: "",
    description: "",
};

const RoleFormModal = ({ isOpen, mode, roleType, role, isSubmitting = false, onClose, onSubmit }: RoleFormModalProps) => {
    const [form, setForm] = useState<RoleFormValues>(emptyValues);

    useEffect(() => {
        if (!isOpen) return;
        setForm(
            role
                ? {
                      name: role.name || "",
                      description: role.description || "",
                  }
                : emptyValues
        );
    }, [isOpen, role]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        await onSubmit(form);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Thêm role" : "Sửa role"}>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">Loại role</p>
                    <p className="mt-1">{role?.roleType || roleType || "ADMIN"}</p>
                </div>

                <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tên role</span>
                    <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        placeholder="Ví dụ: CONTENT_MANAGER"
                        required
                    />
                </label>

                <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Mô tả</span>
                    <textarea
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        placeholder="Mô tả ngắn cho role"
                    />
                </label>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RoleFormModal;
