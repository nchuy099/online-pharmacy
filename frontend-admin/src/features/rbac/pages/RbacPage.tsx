import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaPlus, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/hooks";
import rbacApi from "../api";
import { CurrentAccess, Permission, RoleSummary } from "../types";
import RoleTable from "../components/RoleTable";
import PermissionTable from "../components/PermissionTable";
import RoleFormModal from "../components/RoleFormModal";
import { Column, DataTable, FilterConfig, Modal, Pagination, SearchFilter } from "../../../shared/components/ui";
import { resolveApiErrorMessage } from "../../../shared/services/apiError";
import userService from "../../user/services";
import { User } from "../../user/types/domain";
import RoleBadges from "../../user/components/RoleBadges";
import StatusBadge from "../../user/components/StatusBadge";

type ViewTab = "roles" | "permissions" | "admins";
type RoleFormMode = "create";
const HIDDEN_ADMIN_ROLE_NAMES = new Set(["CUSTOMER", "PHARMACIST"]);

const PAGE_SIZE = 10;

const RbacPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, hasPermission } = useAuth();
    const canManage = hasPermission("MANAGE_RBAC");
    const canAssignRole = hasPermission("ASSIGN_USER_ROLE");

    const [currentAccess, setCurrentAccess] = useState<CurrentAccess | null>(null);
    const [roles, setRoles] = useState<RoleSummary[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [activeTab, setActiveTab] = useState<ViewTab>("admins");
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [selectedPermissionId, setSelectedPermissionId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [roleSearch, setRoleSearch] = useState("");
    const [roleStatusFilter, setRoleStatusFilter] = useState("all");
    const [permissionSearch, setPermissionSearch] = useState("");
    const [permissionStatusFilter, setPermissionStatusFilter] = useState("all");
    const [adminSearch, setAdminSearch] = useState("");
    const [adminStatusFilter, setAdminStatusFilter] = useState("all");
    const [adminPage, setAdminPage] = useState(1);
    const [adminUsers, setAdminUsers] = useState<User[]>([]);
    const [adminTotalPages, setAdminTotalPages] = useState(0);
    const [adminTotalElements, setAdminTotalElements] = useState(0);
    const [isAdminsLoading, setIsAdminsLoading] = useState(false);
    const [adminRoleOptions, setAdminRoleOptions] = useState<Array<{ name: string }>>([]);
    const [isSavingRoleFor, setIsSavingRoleFor] = useState<string | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedAdminUser, setSelectedAdminUser] = useState<User | null>(null);
    const [selectedAdminRole, setSelectedAdminRole] = useState("");

    const loadData = async (preferredRoleId?: string, preferredPermissionId?: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const [currentAccessResponse, rolesResponse, permissionsResponse] = await Promise.all([
                rbacApi.getCurrentAccess().catch(() => null),
                rbacApi.getAdminRoleSummaries(),
                rbacApi.getPermissions(),
            ]);

            const nextCurrentAccess = currentAccessResponse?.data || null;
            const nextRoles = rolesResponse.data || [];
            const nextPermissions = permissionsResponse.data || [];

            setCurrentAccess(nextCurrentAccess);
            setRoles(nextRoles);
            setPermissions(nextPermissions);

            const nextSelectedRoleId =
                (preferredRoleId && nextRoles.some((role) => role.id === preferredRoleId) && preferredRoleId)
                || (nextCurrentAccess?.name && nextRoles.find((role) => role.name === nextCurrentAccess.name)?.id)
                || (user?.role && nextRoles.find((role) => role.name === user.role)?.id)
                || nextRoles[0]?.id
                || "";

            const nextSelectedPermissionId =
                (preferredPermissionId && nextPermissions.some((permission) => permission.id === preferredPermissionId) && preferredPermissionId)
                || nextPermissions[0]?.id
                || "";

            setSelectedRoleId(nextSelectedRoleId);
            setSelectedPermissionId(nextSelectedPermissionId);
        } catch (loadError) {
            console.error("Failed to load RBAC data:", loadError);
            setError("Không thể tải dữ liệu phân quyền. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadAdminUsers = async (page: number, search: string, status: string) => {
        try {
            setIsAdminsLoading(true);
            const response = await userService.getAdminList(
                page,
                PAGE_SIZE,
                search || undefined,
                status === "all" ? undefined : status
            );
            setAdminUsers(response.users || []);
            setAdminTotalPages(response.pagination.totalPages || 0);
            setAdminTotalElements(response.pagination.totalElements || 0);
        } catch (loadError) {
            console.error("Failed to load admin users:", loadError);
            toast.error("Không thể tải danh sách quản trị viên");
        } finally {
            setIsAdminsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const view = new URLSearchParams(location.search).get("view");
        if (view === "roles" || view === "permissions" || view === "admins") {
            setActiveTab(view);
            return;
        }
        setActiveTab("admins");
    }, [location.search]);

    useEffect(() => {
        if (activeTab !== "admins") return;
        loadAdminUsers(adminPage, adminSearch, adminStatusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, adminPage, adminSearch, adminStatusFilter]);

    useEffect(() => {
        if (activeTab !== "admins") return;
        rbacApi.getAdminRoleOptions()
            .then((response) => {
                const options = (response.data || [])
                    .filter((role) => {
                        const roleName = role.name?.trim().toUpperCase();
                        return roleName ? !HIDDEN_ADMIN_ROLE_NAMES.has(roleName) : false;
                    })
                    .map((role) => ({ name: role.name }));
                setAdminRoleOptions(options);
            })
            .catch((error) => {
                console.error("Failed to load admin role options:", error);
                setAdminRoleOptions([]);
            });
    }, [activeTab]);

    const handleSelectRole = (roleId: string) => {
        setActiveTab("roles");
        setSelectedRoleId(roleId);
        navigate(`/rbac/roles/${roleId}`);
    };

    const handleSelectPermission = (permission: Permission) => {
        setActiveTab("permissions");
        setSelectedPermissionId(permission.id);
        navigate(`/rbac/permissions/${permission.id}`);
    };

    const handleCreateRole = async (values: { name: string; description: string }) => {
        try {
            setIsSubmitting(true);
            const response = await rbacApi.createRole({
                name: values.name.trim(),
                description: values.description.trim() || undefined,
                roleType: "ADMIN",
            });

            toast.success("Đã tạo role mới");
            setIsRoleFormOpen(false);
            const createdRole = response.data;
            await loadData(createdRole?.id || undefined, selectedPermissionId);
            if (createdRole?.id) {
                navigate(`/rbac/roles/${createdRole.id}`);
            }
        } catch (createError: any) {
            console.error("Failed to create role:", createError);
            toast.error(resolveApiErrorMessage(createError, "Không thể tạo role"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdminRoleChange = async (targetUser: User, newRole: string) => {
        if (targetUser.role === newRole) return;
        try {
            setIsSavingRoleFor(targetUser.id);
            await userService.changeRole(targetUser.id, { roleName: newRole });
            toast.success("Đã đổi vai trò quản trị viên");
            await loadAdminUsers(adminPage, adminSearch, adminStatusFilter);
        } catch (changeError: any) {
            toast.error(resolveApiErrorMessage(changeError, "Không thể đổi vai trò"));
        } finally {
            setIsSavingRoleFor(null);
        }
    };

    const openRoleModal = (targetUser: User) => {
        if (targetUser.role === "SUPER_ADMIN") return;
        setSelectedAdminUser(targetUser);
        setSelectedAdminRole(targetUser.role || "");
        setIsRoleModalOpen(true);
    };

    const closeRoleModal = () => {
        setIsRoleModalOpen(false);
        setSelectedAdminUser(null);
        setSelectedAdminRole("");
    };

    const saveRoleFromModal = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedAdminUser || !selectedAdminRole) return;
        await handleAdminRoleChange(selectedAdminUser, selectedAdminRole);
        closeRoleModal();
    };

    const filteredRoles = roles.filter((role) => {
        const searchText = `${role.name} ${role.description || ""}`.toLowerCase();
        const matchesSearch = !roleSearch || searchText.includes(roleSearch.toLowerCase());
        const matchesStatus =
            roleStatusFilter === "all"
            || (roleStatusFilter === "protected" && Boolean(role.protectedRole))
            || (roleStatusFilter === "editable" && !role.protectedRole);
        return matchesSearch && matchesStatus;
    });

    const filteredPermissions = permissions.filter((permission) => {
        const searchText = `${permission.name} ${permission.description || ""}`.toLowerCase();
        const matchesSearch = !permissionSearch || searchText.includes(permissionSearch.toLowerCase());
        const matchesStatus =
            permissionStatusFilter === "all"
            || (permissionStatusFilter === "assignable" && Boolean(permission.assignable))
            || (permissionStatusFilter === "locked" && !permission.assignable);
        return matchesSearch && matchesStatus;
    });

    const activeCount = activeTab === "roles"
        ? filteredRoles.length
        : activeTab === "permissions"
            ? filteredPermissions.length
            : adminUsers.length;

    const adminRows = adminUsers.map((u) => ({ ...u, id: String(u.id) }));
    const adminColumns: Column<any>[] = [
        {
            key: "fullName",
            header: "Họ và tên",
            render: (_v, row) => row.fullName || row.name || "",
        },
        { key: "email", header: "Email" },
        {
            key: "phone",
            header: "Số điện thoại",
            render: (_v, row) => row.phoneNumber || row.phone || "-",
            width: "150px",
        },
        {
            key: "role",
            header: "Vai trò",
            render: (_v, row) => <RoleBadges roles={row.roles} role={row.role} />,
            width: "180px",
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (_v, row) => <StatusBadge status={row.status} />,
            width: "120px",
        },
        {
            key: "id",
            header: "Thao tác",
            width: "160px",
            render: (_v, row) => {
                const isSuperAdmin = row.role === "SUPER_ADMIN";
                return (
                    <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => openRoleModal(row as User)}
                        disabled={!canAssignRole || isSuperAdmin}
                        title={isSuperAdmin ? "SUPER_ADMIN không thể đổi vai trò" : ""}
                    >
                        Đổi vai trò
                    </button>
                );
            },
        },
    ];

    const activeFilters: FilterConfig[] = useMemo(() => {
        if (activeTab === "roles") {
            return [
                {
                    key: "roleStatus",
                    label: "Tất cả trạng thái",
                    value: roleStatusFilter,
                    onChange: setRoleStatusFilter,
                    options: [
                        { label: "Editable", value: "editable" },
                        { label: "Protected", value: "protected" },
                    ],
                },
            ];
        }

        if (activeTab === "permissions") {
            return [
                {
                    key: "permissionStatus",
                    label: "Tất cả trạng thái",
                    value: permissionStatusFilter,
                    onChange: setPermissionStatusFilter,
                    options: [
                        { label: "Assignable", value: "assignable" },
                        { label: "Locked", value: "locked" },
                    ],
                },
            ];
        }

        return [
            {
                key: "adminStatus",
                label: "Tất cả trạng thái",
                value: adminStatusFilter,
                onChange: (value: string) => {
                    setAdminStatusFilter(value);
                    setAdminPage(1);
                },
                options: [
                    { label: "Kích hoạt", value: "ACTIVE" },
                    { label: "Đình chỉ", value: "SUSPENDED" },
                ],
            },
        ];
    }, [activeTab, roleStatusFilter, permissionStatusFilter, adminStatusFilter]);

    const handleClearFilters = () => {
        if (activeTab === "roles") {
            setRoleSearch("");
            setRoleStatusFilter("all");
            return;
        }

        if (activeTab === "permissions") {
            setPermissionSearch("");
            setPermissionStatusFilter("all");
            return;
        }

        setAdminSearch("");
        setAdminStatusFilter("all");
        setAdminPage(1);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <FaSpinner className="h-5 w-5 animate-spin text-slate-600" />
                    <span className="text-sm font-medium text-slate-600">Đang tải dữ liệu phân quyền...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
                <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="mt-0.5 h-5 w-5" />
                    <div>
                        <p className="font-bold">Không thể tải RBAC</p>
                        <p className="mt-1 text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Phân quyền quản trị</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Quản lý vai trò, quyền và danh sách quản trị viên.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {activeTab === "roles" && canManage && (
                        <button
                            type="button"
                            onClick={() => setIsRoleFormOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                        >
                            <FaPlus className="h-3.5 w-3.5" />
                            Thêm mới
                        </button>
                    )}
                </div>
            </div>

            <SearchFilter
                search={activeTab === "roles" ? roleSearch : activeTab === "permissions" ? permissionSearch : adminSearch}
                onSearchChange={(value) => {
                    if (activeTab === "roles") {
                        setRoleSearch(value);
                    } else if (activeTab === "permissions") {
                        setPermissionSearch(value);
                    } else {
                        setAdminSearch(value);
                        setAdminPage(1);
                    }
                }}
                searchPlaceholder={
                    activeTab === "roles"
                        ? "Tìm role theo tên, mô tả..."
                        : activeTab === "permissions"
                            ? "Tìm permission theo tên, mô tả..."
                            : "Tìm quản trị viên theo tên, email, số điện thoại..."
                }
                filters={activeFilters}
                onClear={handleClearFilters}
                accentColor="indigo"
            />

            <div className="px-2 text-xs font-medium text-slate-500 italic">
                Hiển thị {activeCount} trong tổng số {activeTab === "roles" ? roles.length : activeTab === "permissions" ? permissions.length : adminTotalElements}
                {activeTab === "roles" ? " role" : activeTab === "permissions" ? " permission" : " quản trị viên"}
            </div>

            {activeTab === "roles" && (
                <RoleTable
                    roles={filteredRoles}
                    selectedRoleId={selectedRoleId}
                    onSelectRole={handleSelectRole}
                />
            )}

            {activeTab === "permissions" && (
                <PermissionTable
                    permissions={filteredPermissions}
                    selectedPermissionId={selectedPermissionId}
                    onSelect={handleSelectPermission}
                />
            )}

            {activeTab === "admins" && (
                <>
                    <DataTable
                        data={adminRows}
                        columns={adminColumns}
                        isLoading={isAdminsLoading}
                        emptyMessage="Không có quản trị viên phù hợp."
                    />
                    <Pagination
                        currentPage={adminPage}
                        totalPages={adminTotalPages}
                        totalElements={adminTotalElements}
                        pageSize={PAGE_SIZE}
                        onPageChange={setAdminPage}
                    />
                </>
            )}

            <RoleFormModal
                isOpen={isRoleFormOpen}
                mode={"create" as RoleFormMode}
                roleType={currentAccess?.roleType || "ADMIN"}
                role={null}
                isSubmitting={isSubmitting}
                onClose={() => setIsRoleFormOpen(false)}
                onSubmit={handleCreateRole}
            />

            <Modal
                isOpen={isRoleModalOpen}
                onClose={closeRoleModal}
                title="Đổi vai trò quản trị viên"
            >
                <form onSubmit={saveRoleFromModal} className="space-y-4">
                    <div className="text-sm text-slate-600">
                        {selectedAdminUser?.fullName || selectedAdminUser?.name || selectedAdminUser?.email}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò mới</label>
                        <select
                            className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={selectedAdminRole}
                            onChange={(e) => setSelectedAdminRole(e.target.value)}
                            disabled={isSavingRoleFor != null}
                            required
                        >
                            <option value="" disabled>Chọn vai trò</option>
                            {adminRoleOptions.map((roleOption) => (
                                <option key={roleOption.name} value={roleOption.name}>
                                    {roleOption.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeRoleModal}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSavingRoleFor != null || !selectedAdminRole}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50"
                        >
                            {isSavingRoleFor != null ? "Đang cập nhật..." : "Cập nhật vai trò"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RbacPage;
