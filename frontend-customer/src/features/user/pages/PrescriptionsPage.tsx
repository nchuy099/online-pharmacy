import React, { useState, useEffect } from "react";
import { FaFilePrescription, FaPills, FaCalendarAlt, FaUserMd, FaChevronDown, FaChevronUp, FaSpinner } from "react-icons/fa";
import { chatApi } from "@/features/chat/api/chat.api";
import type { PrescriptionDTO } from "@/features/chat/types/dto";

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const PrescriptionCard: React.FC<{ prescription: PrescriptionDTO }> = ({ prescription }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Card Header */}
            <div
                className="flex items-center gap-4 p-5 cursor-pointer"
                onClick={() => setExpanded(v => !v)}
            >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <FaFilePrescription className="text-white text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm leading-tight line-clamp-1">{prescription.diagnosis}</p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 font-bold">
                            <FaUserMd className="text-emerald-500 text-[9px]" /> {prescription.pharmacistName}
                        </span>
                        <span className="text-[11px] text-gray-400">·</span>
                        <span className="text-[11px] text-gray-400 font-bold">{formatDate(prescription.createdAt)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full">
                        {prescription.items.length} loại
                    </span>
                    {expanded ? (
                        <FaChevronUp className="text-gray-300 text-xs" />
                    ) : (
                        <FaChevronDown className="text-gray-300 text-xs" />
                    )}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t border-gray-50">
                    {/* Medicine List */}
                    <div className="divide-y divide-gray-50">
                        {prescription.items.map((item, idx) => (
                            <div key={item.id} className="flex gap-3 px-5 py-4">
                                <div className="text-[10px] font-black text-gray-300 w-4 text-center pt-1">{idx + 1}</div>
                                {item.productImageUrl ? (
                                    <img src={item.productImageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                        <FaPills className="text-emerald-300" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 leading-tight">{item.productWebName || item.productName}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                                            Số lượng: {item.quantity}
                                        </span>
                                        {item.variantName && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                                                {item.variantName}
                                            </span>
                                        )}
                                        {item.unit && (
                                            <span className="text-[10px] text-gray-400 font-medium">({item.unit})</span>
                                        )}
                                    </div>
                                    <div className="mt-1.5 space-y-1">
                                        {(item.dosage || item.frequency || item.duration) && (
                                            <p className="text-[11px] text-teal-700 font-bold leading-relaxed">
                                                {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" | ")}
                                            </p>
                                        )}
                                        {item.instructions && (
                                            <p className="text-[11px] text-gray-500 italic leading-relaxed">{item.instructions}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer notes */}
                    {(prescription.generalInstructions || prescription.followUpDate) && (
                        <div className="mx-4 mb-4 p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                            {prescription.generalInstructions && (
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    📋 <strong>Lời dặn:</strong> {prescription.generalInstructions}
                                </p>
                            )}
                            {prescription.followUpDate && (
                                <div className="flex items-center gap-2">
                                    <FaCalendarAlt className="text-amber-500 text-xs" />
                                    <p className="text-xs font-bold text-amber-700">
                                        Ngày tái khám: {formatDate(prescription.followUpDate)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const PrescriptionsPage: React.FC = () => {
    const [prescriptions, setPrescriptions] = useState<PrescriptionDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await chatApi.getMyPrescriptions(page, 10);
                setPrescriptions(data.content);
                setTotalPages(data.totalPages);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [page]);

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <FaFilePrescription className="text-white text-xl" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Đơn Thuốc Của Tôi</h1>
                    <p className="text-sm text-gray-400 font-medium mt-0.5">Lịch sử đơn thuốc được kê bởi dược sĩ</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <FaSpinner className="text-3xl text-emerald-400 animate-spin mb-4" />
                    <p className="text-sm text-gray-400">Đang tải đơn thuốc...</p>
                </div>
            ) : prescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
                        <FaFilePrescription className="text-3xl text-gray-300" />
                    </div>
                    <h3 className="font-black text-gray-600 text-lg">Chưa có đơn thuốc nào</h3>
                    <p className="text-sm text-gray-400 mt-2 max-w-xs">
                        Khi dược sĩ kê đơn cho bạn trong cuộc tư vấn, đơn thuốc sẽ xuất hiện ở đây.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {prescriptions.map(p => (
                        <PrescriptionCard key={p.id} prescription={p} />
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-4">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                ← Trước
                            </button>
                            <span className="text-sm font-bold text-gray-400">
                                Trang {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PrescriptionsPage;
