import { FaShieldAlt, FaUserShield } from "react-icons/fa";
import { CurrentAccess, RolePermission } from "../types";

interface RbacSummaryProps {
    currentAccess: CurrentAccess | null;
    selectedRole: RolePermission | null;
    selectedCount: number;
    totalCount: number;
}

const RbacSummary = ({ currentAccess, selectedRole, selectedCount, totalCount }: RbacSummaryProps) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600">
                        <FaUserShield className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Vai trò hiện tại</p>
                        <p className="text-lg font-semibold text-slate-900">{currentAccess?.name || "N/A"}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        {currentAccess?.roleType || "UNKNOWN"}
                    </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                    {currentAccess?.description || "Thông tin quyền hiện hành được lấy từ backend."}
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600">
                        <FaShieldAlt className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Role đang chọn</p>
                        <p className="text-lg font-semibold text-slate-900">{selectedRole?.name || "Chưa chọn"}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        {selectedRole?.roleType || "UNKNOWN"}
                    </span>
                    {selectedRole?.protectedRole && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                            protected
                        </span>
                    )}
                </div>
                <p className="mt-3 text-sm text-slate-500">
                    {selectedRole?.description || "Chọn một role để xem và cập nhật permission."}
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2">Tổng quan quyền</p>
                <div className="flex items-end gap-3">
                    <p className="text-3xl font-semibold text-slate-900">{selectedCount}</p>
                    <p className="text-sm text-slate-500 mb-1">/ {totalCount} quyền được chọn</p>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                    Các checkbox bên phải phản ánh mapping hiện tại của role.
                </p>
            </div>
        </div>
    );
};

export default RbacSummary;
