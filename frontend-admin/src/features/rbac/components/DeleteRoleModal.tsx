import Modal from "../../../shared/components/ui/Modal";
import { RoleSummary } from "../types";

interface DeleteRoleModalProps {
    isOpen: boolean;
    role: RoleSummary | null;
    isSubmitting?: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
}

const DeleteRoleModal = ({ isOpen, role, isSubmitting = false, onClose, onConfirm }: DeleteRoleModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Xóa role">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Bạn đang xóa role <span className="font-semibold text-slate-900">{role?.name || ""}</span>.
                    Hành động này chỉ khả dụng với role không protected và không còn user nào đang dùng role đó.
                </p>
                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="rounded-xl border border-rose-200 bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Đang xóa..." : "Xóa role"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteRoleModal;
