import { Permission } from "../types";

interface PermissionDetailPanelProps {
    permission: Permission | null;
    assignedRoleNames?: string[];
}

const PermissionDetailPanel = ({ permission, assignedRoleNames = [] }: PermissionDetailPanelProps) => {
    if (!permission) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Chọn một permission bên trái để xem chi tiết.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-slate-900">{permission.description || permission.name}</h3>
                    {permission.critical && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            critical
                        </span>
                    )}
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            permission.assignable
                                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                                : "border border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                    >
                        {permission.assignable ? "Assignable" : "Locked"}
                    </span>
                </div>
                <div>
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        Mã: {permission.name}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold">
                        Critical: {permission.critical ? "Yes" : "No"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold">
                        Assignable: {permission.assignable ? "Yes" : "No"}
                    </span>
                </div>
                <div className="pt-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Role được gán</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {assignedRoleNames.length > 0 ? assignedRoleNames.map((roleName) => (
                            <span
                                key={roleName}
                                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
                            >
                                {roleName}
                            </span>
                        )) : (
                            <span className="text-sm text-slate-500">Chưa được gán cho role nào.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionDetailPanel;
