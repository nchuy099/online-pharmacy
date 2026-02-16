import { FaTimes, FaHistory, FaPrescriptionBottleAlt, FaBoxOpen, FaInfoCircle } from 'react-icons/fa';
import type { PatientHistoryResponse } from '../types/patient';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientHistoryResponse | null;
    isLoading: boolean;
}

export default function PurchaseHistoryModal({ isOpen, onClose, patient, isLoading }: Props) {
    if (!isOpen) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaHistory className="text-blue-500" /> CHI TIẾT LỊCH SỬ & ĐƠN THUỐC
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : patient ? (
                        <>
                            {/* Medical Prescriptions */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <FaPrescriptionBottleAlt className="text-teal-500" /> Lịch sử Đơn thuốc ({patient.prescriptions?.length || 0})
                                </h3>
                                {patient.prescriptions && patient.prescriptions.length > 0 ? (
                                    <div className="space-y-4">
                                        {patient.prescriptions.map(rx => (
                                            <div key={rx.id} className="bg-teal-50/30 dark:bg-teal-900/10 border border-teal-100/50 dark:border-teal-900/30 rounded-2xl p-5 group transition-all hover:bg-teal-50/50">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/50 px-2 py-1 rounded-md uppercase tracking-wider">
                                                                {new Date(rx.createdAt).toLocaleDateString('vi-VN')}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-400">ID: {rx.id.slice(0, 8)}</span>
                                                        </div>
                                                        <h4 className="font-black text-gray-900 dark:text-white mt-2 leading-tight">Chẩn đoán: {rx.diagnosis || 'N/A'}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-bold text-gray-500 bg-white/50 dark:bg-gray-800 px-2 py-1 rounded-lg">DS. {rx.pharmacistName}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {rx.items.map(item => (
                                                        <div key={item.id} className="flex flex-col border-t border-teal-100/50 dark:border-teal-800/30 pt-3 first:border-0 first:pt-0">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">
                                                                        {item.productName}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        {item.variantName && (
                                                                            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded uppercase">
                                                                                {item.variantName}
                                                                            </span>
                                                                        )}
                                                                        {item.unit && (
                                                                            <span className="text-[10px] text-gray-500 font-medium">ĐVT: {item.unit}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right ml-4 shrink-0">
                                                                    <span className="text-sm font-black text-gray-900 dark:text-white">x{item.quantity}</span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2 bg-white/40 dark:bg-black/20 p-2 rounded-xl border border-teal-50/50 dark:border-teal-900/20">
                                                                <FaInfoCircle size={10} className="text-teal-400 shrink-0" />
                                                                <p className="text-[11px] font-bold text-teal-800 dark:text-teal-300">
                                                                    {[item.dosage, item.frequency, item.duration, item.instructions].filter(Boolean).join(" | ")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {(rx.generalInstructions || rx.followUpDate) && (
                                                    <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20 rounded-xl space-y-1.5">
                                                        {rx.generalInstructions && (
                                                            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 italic">Ghi chú: {rx.generalInstructions}</p>
                                                        )}
                                                        {rx.followUpDate && (
                                                            <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                                                Tái khám: {new Date(rx.followUpDate).toLocaleDateString('vi-VN')}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-800">
                                        <FaPrescriptionBottleAlt className="mx-auto text-gray-200 dark:text-gray-700 mb-3" size={32} />
                                        <p className="text-sm text-gray-500 font-bold italic">Chưa có đơn thuốc nào được ghi nhận.</p>
                                    </div>
                                )}
                            </div>

                            {/* E-commerce Orders */}
                            <div className="mt-4">
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <FaBoxOpen className="text-blue-500" /> Đơn hàng E-commerce ({patient.recentOrders?.length || 0})
                                </h3>
                                {patient.recentOrders && patient.recentOrders.length > 0 ? (
                                    <div className="space-y-4">
                                        {patient.recentOrders.map(order => (
                                            <div key={order.id} className="bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden group transition-all hover:bg-gray-100/50">
                                                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-gray-800/50">
                                                    <div>
                                                        <div className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                            <span className="text-xs uppercase text-gray-400">Mã đơn:</span> {order.orderCode}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                                            order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-4 space-y-3">
                                                    {(order.items ?? []).map((item, idx) => {
                                                        const lineTotal = item.unitPrice * item.quantity;
                                                        return (
                                                            <div key={idx} className="flex justify-between items-start group/item">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate group-hover/item:text-blue-600 transition-colors">
                                                                        {item.productName}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        {item.variantName && (
                                                                            <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded uppercase">
                                                                                {item.variantName}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Giá: {formatCurrency(item.unitPrice || 0)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right ml-4 shrink-0 flex flex-col items-end">
                                                                    <span className="text-xs font-black text-gray-900 dark:text-white">x{item.quantity}</span>
                                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatCurrency(lineTotal)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                <div className="px-4 py-3 bg-white/30 dark:bg-black/10 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng thanh toán</span>
                                                    <span className="text-base font-black text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(order.finalAmount)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-800">
                                        <FaBoxOpen className="mx-auto text-gray-200 dark:text-gray-700 mb-3" size={32} />
                                        <p className="text-sm text-gray-500 font-bold italic">Chưa có đơn hàng e-commerce.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/40 rounded-[2.5rem] border-4 border-dashed border-gray-100 dark:border-gray-800">
                            <FaHistory className="mx-auto text-gray-200 dark:text-gray-700 mb-6" size={48} />
                            <p className="text-base font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Không tìm thấy dữ liệu bệnh nhân</p>
                            <p className="text-xs text-gray-400 mt-2">Vui lòng kiểm tra lại ID bệnh nhân hoặc kết nối mạng</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
