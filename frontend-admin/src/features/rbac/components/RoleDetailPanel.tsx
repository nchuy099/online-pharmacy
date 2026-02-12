import { FaEdit, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { Permission, RolePermission, RoleSummary } from "../types";
import PermissionTable from "./PermissionTable";

interface RoleDetailPanelProps {
    role: RoleSummary | null;
    roleDetail: RolePermission | null;
    permissions: Permission[];
    selectedNames: string[];
    isDetailLoading?: boolean;
    canManage?: boolean;
    canEditSelectedRole?: boolean;
    isPermissionEditMode?: boolean;
    isDirty?: boolean;
    onEditRole: () => void;
    onOpenRoleInfoEdit: () => void;
    onDeleteRole: () => void;
    onSavePermissions: () => void;
    onResetPermissions: () => void;
    onTogglePermission: (permissionName: string) => void;
}

const RoleDetailPanel = ({
    role,
    roleDetail,
    permissions,
    selectedNames,
    isDetailLoading = false,
    canManage = false,
    canEditSelectedRole = false,
    isPermissionEditMode = false,
    isDirty = false,
    onEditRole,
    onOpenRoleInfoEdit,
    onDeleteRole,
    onSavePermissions,
    onResetPermissions,
    onTogglePermission,
}: RoleDetailPanelProps) => {
    if (!role) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Chọn một role bên trái để xem chi tiết và chỉnh quyền.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-slate-900">{role.name}</h3>
                        {canManage && !role.protectedRole && (
                            <button
                                type="button"
                                onClick={onOpenRoleInfoEdit}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                aria-label="Sửa thông tin"
                                title="Sửa thông tin"
                            >
                                <FaEdit className="h-3 w-3" />
                            </button>
                        )}
                        {role.protectedRole && (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                protected
                            </span>
                        )}
                    </div>
                    <div>
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                            Mã: {role.name}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">{role.description || "Không có mô tả"}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold">
                            Loại: {role.roleType || "ADMIN"}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold">
                            Số người dùng: {role.userCount ?? 0}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold">
                            Số quyền: {role.permissionCount ?? roleDetail?.permissions.length ?? 0}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {canManage && !role.protectedRole && (
                        <>
                            {!isPermissionEditMode && (
                                <button
                                    type="button"
                                    onClick={onEditRole}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    <FaEdit className="h-3.5 w-3.5" />
                                    Gán quyền
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onDeleteRole}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                            >
                                <FaTrash className="h-3.5 w-3.5" />
                                Xóa role
                            </button>
                        </>
                    )}
                    {canEditSelectedRole && isPermissionEditMode && (
                        <>
                            <button
                                type="button"
                                onClick={onResetPermissions}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FaTimes className="h-3.5 w-3.5" />
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={onSavePermissions}
                                disabled={!isDirty}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FaSave className="h-3.5 w-3.5" />
                                Lưu quyền
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isDetailLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Đang tải chi tiết role...
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">Permission mapping</h4>
                                <p className="mt-1 text-xs text-slate-500">
                                    {isPermissionEditMode
                                        ? "Chọn checkbox để thêm hoặc bỏ quyền."
                                        : "Danh sách quyền hiện đang được gán cho role."}
                                </p>
                            </div>
                            <p className="text-xs font-semibold text-slate-500">
                                {selectedNames.length} / {permissions.length}
                            </p>
                        </div>
                    </div>

                    <PermissionTable
                        permissions={permissions}
                        selectedNames={selectedNames}
                        editable={canEditSelectedRole && isPermissionEditMode}
                        disabled={!canEditSelectedRole || !isPermissionEditMode}
                        onToggle={onTogglePermission}
                    />
                </div>
            )}
        </div>
    );
};

export default RoleDetailPanel;
