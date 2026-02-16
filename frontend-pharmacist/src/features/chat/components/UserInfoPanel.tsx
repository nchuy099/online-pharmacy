import { FaUser, FaPills, FaCog, FaTimesCircle, FaSearch, FaFilePrescription, FaChevronRight } from 'react-icons/fa';
import type { CustomerInfo, SessionStatus } from '../types/domain';

interface Props {
    customer: CustomerInfo | null;
    onRecommendDrug: () => void;
    onEndSession: () => void;
    onViewPatientDetails: () => void;
    onViewPurchaseHistory: () => void;
    onCreatePrescription: () => void;
    sessionStatus?: SessionStatus;
}

export default function UserInfoPanel({
    customer,
    onRecommendDrug,
    onEndSession,
    onViewPatientDetails,
    onViewPurchaseHistory,
    onCreatePrescription,
    sessionStatus
}: Props) {
    if (!customer) {
        return (
            <div className="h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center p-6">
                <p className="text-xs text-gray-400 font-medium text-center">Chọn phiên tư vấn để xem thông tin</p>
            </div>
        );
    }

    return (
        <div className="h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
            {/* User Info */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FaUser className="text-emerald-500 text-xs" />
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Thông tin</h3>
                    </div>
                    <button onClick={onViewPatientDetails} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                        Xem <FaChevronRight className="text-[8px]" />
                    </button>
                </div>
                <InfoRow label="Họ tên" value={customer.name} />
            </div>

            {/* Purchase History */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FaPills className="text-green-500 text-xs" />
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Lịch sử Mua & Khám</h3>
                    </div>
                    <button onClick={onViewPurchaseHistory} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                        Xem <FaChevronRight className="text-[8px]" />
                    </button>
                </div>
                <p className="text-xs text-gray-400 font-medium">Nhấn "Xem" để mở chi tiết lịch sử mua và khám.</p>
            </div>

            {/* Drug Recommendation */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <FaPills className="text-teal-500 text-xs" />
                    <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Đề xuất thuốc</h3>
                </div>
                <button
                    onClick={onCreatePrescription}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors mb-2"
                >
                    <FaFilePrescription className="text-[10px]" /> Kê Đơn Thuốc
                </button>
                <div className="relative">
                    <button
                        onClick={onRecommendDrug}
                        className="w-full text-left px-9 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl text-[10px] font-bold text-gray-400 hover:border-teal-300 dark:hover:border-teal-700 transition-all uppercase tracking-wider"
                    >
                        Tìm thuốc...
                    </button>
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]" />
                </div>
            </div>

            {/* Actions */}
            <div className="p-5 mt-auto">
                <div className="flex items-center gap-2 mb-4">
                    <FaCog className="text-gray-500 text-xs" />
                    <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">Hành động</h3>
                </div>
                <div className="space-y-2">
                    {sessionStatus === 'CLOSED' ? (
                        <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-600">
                            <FaTimesCircle className="text-[10px]" /> Đã kết thúc
                        </div>
                    ) : (
                        <button
                            onClick={onEndSession}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                            <FaTimesCircle className="text-[10px]" /> Kết thúc phiên
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className={`text-xs font-bold ${highlight ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{value}</span>
        </div>
    );
}
