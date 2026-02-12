import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import { Permission } from "../types";

interface PermissionChecklistProps {
    permissions: Permission[];
    selectedNames: string[];
    onToggle: (permissionName: string) => void;
    disabled?: boolean;
}

const PermissionChecklist = ({
    permissions,
    selectedNames,
    onToggle,
    disabled = false,
}: PermissionChecklistProps) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Permissions</p>
                    <h2 className="text-lg font-semibold text-slate-900 mt-1">Danh sách quyền</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {selectedNames.length} / {permissions.length}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        locked items are read-only
                    </span>
                </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {permissions.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                        Không có permission cùng role type với role đang chọn.
                    </div>
                ) : permissions.map((permission) => {
                    const checked = selectedNames.includes(permission.name);
                    const locked = !permission.assignable;
                    const isDisabled = disabled || locked;

                    return (
                        <button
                            key={permission.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => onToggle(permission.name)}
                            className={`text-left rounded-xl border p-4 transition-all ${isDisabled ? "cursor-not-allowed opacity-80" : "hover:border-slate-300 hover:bg-slate-50"} ${checked ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-white"}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 ${checked ? "text-slate-700" : "text-slate-300"}`}>
                                    {checked ? <FaCheckSquare className="w-4 h-4" /> : <FaRegSquare className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{permission.name}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {permission.critical && (
                                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
                                                critical
                                            </span>
                                        )}
                                        {locked && (
                                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                                                locked
                                            </span>
                                        )}
                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
                                            {permission.roleType || "ADMIN"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {permission.description || "Không có mô tả"}
                                    </p>
                                    {locked && (
                                        <p className="mt-2 text-xs font-medium text-slate-400">
                                            Quyền này được backend đánh dấu không cho gán tùy ý.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PermissionChecklist;
