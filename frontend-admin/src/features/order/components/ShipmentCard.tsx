import React from 'react';
import { ShipmentInfo } from '../types/domain';
import { FiPackage, FiTruck, FiMapPin, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface ShipmentCardProps {
    shipment?: ShipmentInfo;
    receiverAddress?: string;
    shippingServiceName?: string;
    shippingFeeText?: string;
    expectedDeliveryText?: string;
}

const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
        case 'picking':
            return <FiPackage className="w-5 h-5 text-blue-500" />;
        case 'picked':
            return <FiPackage className="w-5 h-5 text-blue-500" />;
        case 'storing':
            return <FiMapPin className="w-5 h-5 text-orange-500" />;
        case 'delivering':
            return <FiTruck className="w-5 h-5 text-purple-500" />;
        case 'delivered':
        case 'finish':
            return <FiCheckCircle className="w-5 h-5 text-green-500" />;
        case 'return':
        case 'returned':
            return <FiXCircle className="w-5 h-5 text-red-500" />;
        default:
            return <FiClock className="w-5 h-5 text-gray-500" />;
    }
};

const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
        case 'picking': return 'Đang lấy hàng';
        case 'picked': return 'Đã lấy hàng';
        case 'storing': return 'Đang lưu kho';
        case 'delivering': return 'Đang giao hàng';
        case 'delivered': 
        case 'finish': return 'Giao hàng thành công';
        case 'return': return 'Đang hoàn hàng';
        case 'returned': return 'Đã hoàn hàng';
        default: return status;
    }
};

const ShipmentCard: React.FC<ShipmentCardProps> = ({
    shipment,
    receiverAddress,
    shippingServiceName = '-',
    shippingFeeText = '-',
    expectedDeliveryText = '-',
}) => {
    if (!shipment) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiTruck className="text-gray-500" /> Thông tin vận chuyển
                </h3>
                <p className="text-gray-500 text-sm">Chưa có thông tin vận chuyển cho đơn hàng này.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiTruck className="text-blue-600" /> Thông tin vận chuyển
                </h3>
                <div className="text-sm font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                    Mã VN: {shipment.orderCode}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Người gửi</p>
                        <p className="font-medium text-gray-800">{shipment.fromName}</p>
                        <p className="text-sm text-gray-600">{shipment.fromPhone}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{shipment.fromAddress}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Người nhận</p>
                        <p className="font-medium text-gray-800">{shipment.toName}</p>
                        <p className="text-sm text-gray-600">{shipment.toPhone}</p>
                        <p className="text-sm text-gray-600 mt-1">{receiverAddress || shipment.toAddress}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                    <p className="text-sm text-gray-500">Trạng thái Giao Hàng</p>
                    <p className="font-medium text-gray-800 flex items-center gap-2 mt-1">
                        {getStatusIcon(shipment.status)} {getStatusLabel(shipment.status)}
                    </p>
                </div>
                <div>
                     <p className="text-sm text-gray-500">Dự kiến giao hàng</p>
                     <p className="font-medium text-gray-800 mt-1">
                        {shipment.leadtime ? new Date(shipment.leadtime).toLocaleDateString('vi-VN') : 'N/A'}
                     </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div>
                    <p className="text-sm text-gray-500">Dịch vụ vận chuyển</p>
                    <p className="font-medium text-gray-800 mt-1">{shippingServiceName}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Phí vận chuyển</p>
                    <p className="font-medium text-gray-800 mt-1">{shippingFeeText}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Dự kiến giao (đơn hàng)</p>
                    <p className="font-medium text-gray-800 mt-1">{expectedDeliveryText}</p>
                </div>
            </div>

            {/* Timeline Log */}
            {shipment.log && shipment.log.length > 0 && (
                <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-md font-medium text-gray-800 mb-4">Lộ trình vận chuyển</h4>
                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                        {shipment.log.map((logItem, index) => (
                             <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-6">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                     {getStatusIcon(logItem.status)}
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between space-x-2 mb-1">
                                        <div className="font-bold text-slate-900">{getStatusLabel(logItem.status)}</div>
                                        <time className="text-xs text-slate-500">{new Date(logItem.updatedDate).toLocaleString('vi-VN')}</time>
                                    </div>
                                    <div className="text-sm text-slate-500">{logItem.status.toUpperCase()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShipmentCard;
