import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/hooks";
import rbacApi from "../api";
import { Permission, RolePermission } from "../types";
import RoleDetailPanel from "../components/RoleDetailPanel";
import RoleFormModal from "../components/RoleFormModal";
import DeleteRoleModal from "../components/DeleteRoleModal";
import { resolveApiErrorMessage } from "../../../shared/services/apiError";

const sortNames = (names: string[]) => Array.from(new Set(names)).sort((left, right) => left.localeCompare(right));

const RoleDetailPage = () => {
    const { roleId } = useParams<{ roleId: string }>();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const canManage = hasPermission("MANAGE_RBAC");

    const [role, setRole] = useState<RolePermission | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedNames, setSelectedNames] = useState<string[]>([]);
    const [initialNames, setInitialNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPermissionEditMode, setIsPermissionEditMode] = useState(false);

    const canEditSelectedRole = useMemo(
        () => canManage && Boolean(role) && !role?.protectedRole,
        [canManage, role]
    );

    const isDirty = useMemo(() => {
        const current = sortNames(selectedNames).join("|");
        const initial = sortNames(initialNames).join("|");
        return current !== initial;
    }, [selectedNames, initialNames]);

    const load = async () => {
        if (!roleId) return;
        try {
            setLoading(true);
            setError(null);
            const [roleResponse, permissionsResponse] = await Promise.all([
                rbacApi.getRole(roleId),
                rbacApi.getPermissions(),
            ]);
            const nextRole = roleResponse.data || null;
            const nextPermissions = permissionsResponse.data || [];
            setRole(nextRole);
            setPermissions(nextPermissions.filter((permission) => !nextRole || permission.roleType === nextRole.roleType));

            const nextNames = sortNames((nextRole?.permissions || []).map((permission) => permission.name));
            setSelectedNames(nextNames);
            setInitialNames(nextNames);
            setIsPermissionEditMode(false);
        } catch (loadError) {
            console.error("Failed to load role detail:", loadError);
            setError("Không thể tải chi tiết role.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleId]);

    const handleTogglePermission = (permissionName: string) => {
        if (!canEditSelectedRole) return;

        setSelectedNames((current) => {
            if (current.includes(permissionName)) {
                return current.filter((name) => name !== permissionName);
            }

            return sortNames([...current, permissionName]);
        });
    };

    const handleResetPermissions = () => {
        setSelectedNames(initialNames);
        setIsPermissionEditMode(false);
    };

    const handleSavePermissions = async () => {
        if (!role || !canEditSelectedRole) return;

        try {
            setIsSubmitting(true);
            const response = await rbacApi.updateRolePermissions(role.id, {
                permissionNames: sortNames(selectedNames),
            });
            const updatedRole = response.data;
            if (updatedRole) {
                const nextNames = sortNames(updatedRole.permissions.map((permission) => permission.name));
                setRole(updatedRole);
                setSelectedNames(nextNames);
                setInitialNames(nextNames);
            }
            toast.success("Đã cập nhật quyền cho role");
            setIsPermissionEditMode(false);
        } catch (saveError: any) {
            console.error("Failed to update role permissions:", saveError);
            toast.error(resolveApiErrorMessage(saveError, "Không thể lưu thay đổi quyền"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitRole = async (values: { name: string; description: string }) => {
        if (!role) return;


        try {
            setIsSubmitting(true);
            const response = await rbacApi.updateRole(role.id, {
                name: values.name.trim(),
                description: values.description.trim() || undefined,            });
            setRole(response.data || null);
            toast.success("Đã cập nhật role");
            setIsEditOpen(false);
            await load();
        } catch (updateError: any) {
            console.error("Failed to update role:", updateError);
            toast.error(resolveApiErrorMessage(updateError, "Không thể cập nhật role"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!role) return;

        try {
            setIsSubmitting(true);
            await rbacApi.deleteRole(role.id);
            toast.success("Đã xóa role");
            setIsDeleteOpen(false);
            navigate("/rbac?view=roles");
        } catch (deleteError: any) {
            console.error("Failed to delete role:", deleteError);
            toast.error(resolveApiErrorMessage(deleteError, "Không thể xóa role"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <FaSpinner className="h-5 w-5 animate-spin text-slate-600" />
                    <span className="text-sm font-medium text-slate-600">Đang tải chi tiết role...</span>
                </div>
            </div>
        );
    }

    if (error || !role) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
                <p className="font-bold">Không thể tải role</p>
                <p className="mt-1 text-sm">{error || "Không tìm thấy role"}</p>
                <button
                    type="button"
                    onClick={() => navigate("/rbac?view=roles")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <FaArrowLeft className="h-3.5 w-3.5" />
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/rbac?view=roles")}
                    className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <FaArrowLeft className="h-3.5 w-3.5" />
                </button>
                <div className="text-sm text-slate-500">
                    Chi tiết role
                </div>
            </div>

            <RoleDetailPanel
                role={role}
                roleDetail={role}
                permissions={
                    isPermissionEditMode
                        ? permissions
                        : permissions.filter((permission) => selectedNames.includes(permission.name))
                }
                selectedNames={selectedNames}
                canManage={canManage}
                canEditSelectedRole={Boolean(canEditSelectedRole)}
                isPermissionEditMode={isPermissionEditMode}
                isDirty={isDirty}
                onEditRole={() => setIsPermissionEditMode(true)}
                onOpenRoleInfoEdit={() => setIsEditOpen(true)}
                onDeleteRole={() => setIsDeleteOpen(true)}
                onSavePermissions={handleSavePermissions}
                onResetPermissions={handleResetPermissions}
                onTogglePermission={handleTogglePermission}
            />

            <RoleFormModal
                isOpen={isEditOpen}
                mode="edit"
                roleType={role.roleType || "ADMIN"}
                role={role}
                isSubmitting={isSubmitting}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleSubmitRole}
            />

            <DeleteRoleModal
                isOpen={isDeleteOpen}
                role={role}
                isSubmitting={isSubmitting}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteRole}
            />
        </div>
    );
};

export default RoleDetailPage;
