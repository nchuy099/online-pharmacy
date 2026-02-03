import React from "react";
import { FaFilePrescription, FaPills, FaCalendarAlt, FaUserMd, FaShoppingCart, FaExternalLinkAlt } from "react-icons/fa";
import type { PrescriptionDTO } from "../types/dto";
import { Link } from "react-router-dom";

const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

interface Props {
    content: string; // JSON-stringified PrescriptionDTO
}

export const PrescriptionMessage: React.FC<Props> = ({ content }) => {
    let prescription: PrescriptionDTO;
    try {
        prescription = JSON.parse(content);
    } catch {
        return <div className="text-red-400 text-xs italic">Không thể đọc đơn thuốc</div>;
    }

    return (
        <div className="min-w-[300px] max-w-sm bg-white rounded-2xl border border-emerald-100 shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 flex items-center gap-2">
                <FaFilePrescription className="text-white text-sm" />
                <div>
                    <p className="text-white font-black text-sm leading-tight">Đơn Thuốc</p>
                    <p className="text-white/70 text-[10px] font-bold">{formatDate(prescription.createdAt)}</p>
                </div>
            </div>

            {/* Doctor */}
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <FaUserMd className="text-emerald-500 text-xs" />
                    <span className="text-[11px] font-bold text-gray-600">Dược sĩ: {prescription.pharmacistName}</span>
                </div>
                <div className="mt-1.5 bg-white rounded-lg px-3 py-2 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Chẩn đoán</p>
                    <p className="text-xs font-bold text-gray-800 leading-relaxed">{prescription.diagnosis}</p>
                </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50">
                {prescription.items.map((item, idx) => (
                    <div key={item.id} className="flex gap-3 px-4 py-3">
                        <div className="flex-shrink-0 font-black text-[10px] text-gray-300 w-4 text-center pt-0.5">{idx + 1}</div>
                        {item.productImageUrl ? (
                            <img src={item.productImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <FaPills className="text-emerald-300 text-sm" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">
                                {item.productWebName || item.productName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                                    SL: {item.quantity}
                                </span>
                                {item.variantName && (
                                    <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                                        {item.variantName}
                                    </span>
                                )}
                                {item.unit && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        ({item.unit})
                                    </span>
                                )}
                            </div>
                            <div className="mt-1 space-y-1">
                                {(item.dosage || item.frequency || item.duration) && (
                                    <p className="text-[10px] text-teal-700 font-bold leading-relaxed">
                                        {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" | ")}
                                    </p>
                                )}
                                {item.instructions && (
                                    <p className="text-[10px] text-gray-500 italic leading-relaxed">
                                        {item.instructions}
                                    </p>
                                )}
                            </div>
                            {/* CTA: view product */}
                            {item.productSlug && (
                                <Link
                                    to={`/${item.productSlug}`}
                                    className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1 hover:underline"
                                >
                                    <FaExternalLinkAlt className="text-[8px]" />
                                    Xem sản phẩm
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Notes */}
            {(prescription.generalInstructions || prescription.followUpDate) && (
                <div className="px-4 py-3 bg-amber-50/60 border-t border-amber-100 space-y-2">
                    {prescription.generalInstructions && (
                        <p className="text-[10px] text-amber-800 italic leading-relaxed">
                            📋 {prescription.generalInstructions}
                        </p>
                    )}
                    {prescription.followUpDate && (
                        <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="text-amber-500 text-[9px]" />
                            <p className="text-[10px] font-bold text-amber-700">
                                Tái khám: {formatDate(prescription.followUpDate)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* CTA */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
                <a
                    href="/me/prescriptions"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl transition-colors"
                >
                    <FaShoppingCart className="text-[9px]" />
                    Xem đơn thuốc đầy đủ
                </a>
            </div>
        </div>
    );
};
