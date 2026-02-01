import React from "react";
import { FaTruck } from "react-icons/fa";

import type { ShippingInfo, ShipmentInfo } from "../types/domain";

interface Props {
    address?: ShippingInfo;
    expectedDeliveryTime?: number;
    shipment?: ShipmentInfo;
    onTrackClick?: () => void;
}

export const OrderShippingInfo: React.FC<Props> = ({ address, expectedDeliveryTime, shipment, onTrackClick }) => {
    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <FaTruck className="text-emerald-600" />
                    Thông tin nhận hàng
                </h2>
                {shipment && (
                    <button
                        onClick={onTrackClick}
                        className="flex flex-col items-end group"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mb-1 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            {(shipment.status || "Live").toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 group-hover:text-emerald-600 transition-all">
                            <span className="underline decoration-dotted decoration-gray-300 group-hover:decoration-emerald-400">Xem hành trình</span>
                            <FaTruck size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </button>
                )}
            </div>
            {address ? (
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Người nhận</p>
                        <p className="font-bold text-gray-900">{address.fullName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Số điện thoại</p>
                        <p className="font-bold text-gray-900">{address.phoneNumber}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Địa chỉ</p>
                        <p className="text-gray-600 leading-relaxed font-medium">
                            {address.fullAddress || [
                                address.address,
                                address.wardName,
                                address.districtName,
                                address.provinceName
                            ].filter(Boolean).join(", ")}
                        </p>
                    </div>
                    {expectedDeliveryTime && (
                        <div className="pt-2">
                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-1">Dự kiến nhận hàng</p>
                            <p className="font-bold text-emerald-700">
                                {new Date(expectedDeliveryTime * 1000).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-gray-500 italic">Chưa có thông tin nhận hàng</p>
            )}
        </div>
    );
};
