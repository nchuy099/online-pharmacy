import { DataTable, type Column } from "../../../shared/components/ui";
import { RoleSummary } from "../types";

interface RoleTableProps {
    roles: RoleSummary[];
    selectedRoleId: string;
    onSelectRole: (roleId: string) => void;
}

const RoleTable = ({ roles, selectedRoleId, onSelectRole }: RoleTableProps) => {
    const rows = roles.map((role) => ({ ...role, id: role.id }));

    const columns: Column<RoleSummary>[] = [
        {
            key: "name",
            header: "Vai trò",
            render: (_value, row) => (
                <div>
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{row.description || "Không có mô tả"}</p>
                </div>
            ),
        },
        {
            key: "roleType",
            header: "Loại",
            render: (_value, row) => (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {row.roleType || "ADMIN"}
                </span>
            ),
            width: "130px",
        },
        {
            key: "userCount",
            header: "Số người dùng",
            render: (_value, row) => (
                <span className="text-sm font-semibold text-slate-700">{row.userCount ?? 0}</span>
            ),
            width: "140px",
        },
        {
            key: "permissionCount",
            header: "Số quyền",
            render: (_value, row) => (
                <span className="text-sm font-semibold text-slate-700">{row.permissionCount ?? 0}</span>
            ),
            width: "120px",
        },
        {
            key: "protectedRole",
            header: "Trạng thái",
            render: (_value, row) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        row.protectedRole
                            ? "border border-slate-200 bg-slate-50 text-slate-600"
                            : "border border-emerald-100 bg-emerald-50 text-emerald-700"
                    }`}
                >
                    {row.protectedRole ? "Protected" : "Editable"}
                </span>
            ),
            width: "120px",
        },
    ];

    return (
        <DataTable
            data={rows}
            columns={columns}
            actions={[
                {
                    label: "Chi tiết",
                    onClick: (row) => onSelectRole(row.id),
                    className: "text-emerald-600 hover:text-emerald-900 p-1",
                },
            ]}
            emptyMessage="Chưa có role nào."
            onRowClick={(row) => onSelectRole(row.id)}
            selectedRowId={selectedRoleId}
        />
    );
};

export default RoleTable;
