import { FaCheckCircle } from "react-icons/fa";
import { DataTable, type Column } from "../../../shared/components/ui";
import { Permission } from "../types";

interface PermissionTableProps {
    permissions: Permission[];
    selectedPermissionId?: string;
    selectedNames?: string[];
    editable?: boolean;
    disabled?: boolean;
    onSelect?: (permission: Permission) => void;
    onToggle?: (permissionName: string) => void;
}

const PermissionTable = ({
    permissions,
    selectedPermissionId,
    selectedNames = [],
    editable = false,
    disabled = false,
    onSelect,
    onToggle,
}: PermissionTableProps) => {
    const rows = permissions.map((permission) => ({ ...permission, id: permission.id }));

    const columns: Column<Permission>[] = [
        ...(editable
            ? [{
                key: "id" as keyof Permission,
                header: "",
                width: "56px",
                render: (_value: any, row: Permission) => (
                    <input
                        type="checkbox"
                        className="h-4 w-4 accent-emerald-600"
                        checked={selectedNames.includes(row.name)}
                        disabled={disabled || row.assignable === false}
                        onChange={() => onToggle?.(row.name)}
                        onClick={(event) => event.stopPropagation()}
                    />
                ),
            }]
            : []),
        {
            key: "name",
            header: "Permission",
            render: (_value, row) => (
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{row.description || row.name}</p>
                        {editable && selectedNames.includes(row.name) && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                                <FaCheckCircle className="h-2.5 w-2.5" />
                                Đã chọn
                            </span>
                        )}
                        {row.critical && (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                critical
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs font-mono text-slate-500">Mã: {row.name}</p>
                </div>
            ),
        },
        {
            key: "assignable",
            header: "Trạng thái",
            render: (_value, row) => (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        row.assignable
                            ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                >
                    {row.assignable ? "Assignable" : "Locked"}
                </span>
            ),
            width: "120px",
        },
    ];

    return (
        <DataTable
            data={rows}
            columns={columns}
            actions={editable ? [] : onSelect ? [{
                label: "Chi tiết",
                onClick: (row) => onSelect(row),
                className: "text-emerald-600 hover:text-emerald-900 p-1",
            }] : []}
            emptyMessage="Chưa có permission nào."
            onRowClick={(row) => {
                if (!editable) onSelect?.(row);
            }}
            selectedRowId={!editable ? selectedPermissionId : undefined}
            rowClassName={(row) =>
                editable && selectedNames.includes(row.name)
                    ? "bg-emerald-50/80 ring-1 ring-inset ring-emerald-200 shadow-[inset_4px_0_0_0_rgba(16,185,129,0.95)]"
                    : ""
            }
        />
    );
};

export default PermissionTable;
