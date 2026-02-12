import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import rbacApi from "../api";
import { Permission, RolePermission } from "../types";
import PermissionDetailPanel from "../components/PermissionDetailPanel";

const PermissionDetailPage = () => {
    const { permissionId } = useParams<{ permissionId: string }>();
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [roles, setRoles] = useState<RolePermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const permission = useMemo(
        () => permissions.find((item) => item.id === permissionId) || null,
        [permissions, permissionId]
    );
    const assignedRoleNames = useMemo(() => {
        if (!permission) return [];
        return roles
            .filter((role) => (role.permissions || []).some((item) => item.name === permission.name))
            .map((role) => role.name);
    }, [permission, roles]);

    useEffect(() => {
        const load = async () => {
            if (!permissionId) return;
            try {
                setLoading(true);
                setError(null);
                const [permissionsResponse, rolesResponse] = await Promise.all([
                    rbacApi.getPermissions(),
                    rbacApi.getRoles(),
                ]);
                setPermissions(permissionsResponse.data || []);
                setRoles(rolesResponse.data || []);
            } catch (loadError) {
                console.error("Failed to load permission detail:", loadError);
                setError("Không thể tải chi tiết permission.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [permissionId]);

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <FaSpinner className="h-5 w-5 animate-spin text-slate-600" />
                    <span className="text-sm font-medium text-slate-600">Đang tải chi tiết permission...</span>
                </div>
            </div>
        );
    }

    if (error || !permission) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
                <p className="font-bold">Không thể tải permission</p>
                <p className="mt-1 text-sm">{error || "Không tìm thấy permission"}</p>
                <button
                    type="button"
                    onClick={() => navigate("/rbac?view=permissions")}
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
                    onClick={() => navigate("/rbac?view=permissions")}
                    className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <FaArrowLeft className="h-3.5 w-3.5" />
                </button>
                <div className="text-sm text-slate-500">
                    Chi tiết permission
                </div>
            </div>

            <PermissionDetailPanel permission={permission} assignedRoleNames={assignedRoleNames} />
        </div>
    );
};

export default PermissionDetailPage;
