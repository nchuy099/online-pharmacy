import { FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { RolePermission } from "../types";

interface RoleListProps {
    roles: RolePermission[];
    selectedRoleId: string;
    onSelectRole: (roleId: string) => void;
}

const RoleList = ({ roles, selectedRoleId, onSelectRole }: RoleListProps) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Roles</p>
                <h2 className="text-lg font-semibold text-slate-900 mt-1">Danh sách vai trò</h2>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
                {roles.map((role) => {
                    const active = role.id === selectedRoleId;
                    const permissionCount = role.permissions?.length || 0;

                    return (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => onSelectRole(role.id)}
                            className={`w-full text-left p-4 border-b border-slate-100 transition-colors ${active ? "bg-slate-50" : "hover:bg-slate-50/70"}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {active ? (
                                            <FaCheckCircle className="w-4 h-4 text-slate-700" />
                                        ) : (
                                            <FaRegCircle className="w-4 h-4 text-slate-300" />
                                        )}
                                        <p className="font-semibold text-slate-900">{role.name}</p>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
                                            {role.roleType || "ADMIN"}
                                        </span>
                                        {role.protectedRole && (
                                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                                protected
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                        {role.description || "Không có mô tả"}
                                    </p>
                                </div>
                                <span className="shrink-0 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    {permissionCount} quyền
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default RoleList;
