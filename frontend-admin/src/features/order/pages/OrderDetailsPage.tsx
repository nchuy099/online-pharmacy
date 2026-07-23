import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderDetails } from '../hooks/useOrderDetails';
import OrderCard from '../components/OrderCard';
import OrderInventoryAllocationPanel from '../components/OrderInventoryAllocationPanel';
import PaymentCard from '../components/PaymentCard';
import { PageHeader } from '../../../shared/components';
import { Modal } from '../../../shared/components/ui';
import orderService from '../services';

const getShippingServiceName = (serviceId?: number) => {
    if (serviceId === 1) return 'GHN Nhanh';
    if (serviceId === 2) return 'GHN Tiêu chuẩn';
    if (serviceId === 3) return 'GHN Tiết kiệm';
    return 'GHN Tiêu chuẩn';
};

const GHN_STATUS_LABELS: Record<string, string> = {
    ready_to_pick: 'Chờ lấy hàng',
    picking: 'Đang lấy hàng',
    cancel: 'Đã hủy',
    money_collect_picking: 'Thu tiền người gửi',
    picked: 'Đã lấy hàng',
    storing: 'Đang ở kho',
    transporting: 'Đang trung chuyển',
    sorting: 'Đang phân loại',
    delivering: 'Đang giao',
    money_collect_delivering: 'Thu tiền người nhận',
    delivered: 'Giao thành công',
    delivery_fail: 'Giao thất bại',
    waiting_to_return: 'Chờ hoàn hàng',
    return: 'Đang hoàn hàng',
    return_transporting: 'Đang chuyển hoàn',
    return_sorting: 'Phân loại hàng hoàn',
    returning: 'Đang trả hàng',
    return_fail: 'Trả hàng thất bại',
    returned: 'Trả hàng thành công',
    exception: 'Ngoại lệ',
    damage: 'Hư hỏng',
    lost: 'Thất lạc',
};

const getGhnStatusLabel = (status?: string) => {
    if (!status) return '-';
    const normalized = status.toLowerCase();
    return GHN_STATUS_LABELS[normalized] || status;
};

const OrderDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { order, isLoading, error, refresh } = useOrderDetails(id);
    const [isConfirming, setIsConfirming] = React.useState(false);
    const [isConfirmingPaymentCollection, setIsConfirmingPaymentCollection] = React.useState(false);
    const [isShipping, setIsShipping] = React.useState(false);
    const [isShipConfirmOpen, setIsShipConfirmOpen] = React.useState(false);
    const [isReviewingReturn, setIsReviewingReturn] = React.useState(false);
    const [returnReviewNote, setReturnReviewNote] = React.useState('');

    const handleConfirm = async () => {
        if (!id) return;
        try {
            setIsConfirming(true);
            await orderService.confirmOrder(id);
            await refresh();
        } catch {
            alert('Lỗi xác nhận đơn hàng');
        } finally {
            setIsConfirming(false);
        }
    };

    const handleShip = async () => {
        if (!id) return;
        try {
            setIsShipping(true);
            await orderService.shipOrder(id);
            await refresh();
            setIsShipConfirmOpen(false);
        } catch {
            alert('Lỗi tạo đơn giao hàng');
        } finally {
            setIsShipping(false);
        }
    };

    const handleConfirmPaymentCollection = async () => {
        if (!id) return;
        try {
            setIsConfirmingPaymentCollection(true);
            await orderService.confirmCodPaymentCollection(id);
            await refresh();
        } catch {
            alert('Lỗi xác nhận thu COD');
        } finally {
            setIsConfirmingPaymentCollection(false);
        }
    };

    const handleApproveReturn = async () => {
        if (!id) return;
        try {
            setIsReviewingReturn(true);
            await orderService.approveReturnRequest(id, returnReviewNote.trim() || undefined);
            setReturnReviewNote('');
            await refresh();
        } catch {
            alert('Lỗi duyệt yêu cầu trả hàng');
        } finally {
            setIsReviewingReturn(false);
        }
    };

    const handleRejectReturn = async () => {
        if (!id) return;
        try {
            setIsReviewingReturn(true);
            await orderService.rejectReturnRequest(id, returnReviewNote.trim() || undefined);
            setReturnReviewNote('');
            await refresh();
        } catch {
            alert('Lỗi từ chối yêu cầu trả hàng');
        } finally {
            setIsReviewingReturn(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                <h3 className="text-lg font-semibold">Lỗi tải dữ liệu</h3>
                <p>{error?.message || 'Không tìm thấy đơn hàng'}</p>
                <button
                    onClick={() => navigate('/orders')}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const receiverName = order.address?.fullName || order.shipment?.toName || '-';
    const receiverPhone = order.address?.phoneNumber || order.shipment?.toPhone || '-';
    const receiverAddress = order.address?.fullAddress || order.address?.address || order.shipment?.toAddress || '-';
    const shippingServiceName = getShippingServiceName(order.ghnServiceId);
    const shippingFeeText = typeof order.shippingFee === 'number'
        ? `${order.shippingFee.toLocaleString('vi-VN')} đ`
        : '-';
    const expectedDeliveryText = order.expectedDeliveryTime
        ? new Date(order.expectedDeliveryTime * 1000).toLocaleString('vi-VN')
        : '-';
    const shippingCode = order.shipment?.orderCode || '-';
    const shippingStatusLabel = getGhnStatusLabel(order.shipment?.status);
    const canConfirmPaymentCollection = order.payment?.method === 'COD'
        && order.payment?.status === 'PENDING_COLLECTION';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title={`Đơn hàng #${order.orderCode}`}
                    description="Xem chi tiết các mặt hàng và thông tin thanh toán"
                    onBack={() => navigate('/orders')}
                />
                
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    {order.status === 'PENDING_CONFIRMATION' && (
                        <button
                            onClick={handleConfirm}
                            disabled={isConfirming}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isConfirming ? 'Đang xác nhận...' : 'Xác nhận đơn'}
                        </button>
                    )}
                    {order.status === 'PROCESSING' && (
                        <button
                            onClick={() => setIsShipConfirmOpen(true)}
                            disabled={isShipping}
                            className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isShipping ? 'Đang tạo...' : 'Tạo đơn GHN'}
                        </button>
                    )}
                    {canConfirmPaymentCollection && (
                        <button
                            onClick={handleConfirmPaymentCollection}
                            disabled={isConfirmingPaymentCollection}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isConfirmingPaymentCollection ? 'Đang xác nhận...' : 'Xác nhận đã thu COD'}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <OrderCard order={order} />
                    <OrderInventoryAllocationPanel
                        items={order.items}
                        allocations={(order.items || []).flatMap((item) => item.allocations || [])}
                        isLoading={false}
                    />
                    {/*
                    {order.shipment && (
                        <ShipmentCard
                            shipment={order.shipment}
                            receiverAddress={receiverAddress}
                            shippingServiceName={shippingServiceName}
                            shippingFeeText={shippingFeeText}
                            expectedDeliveryText={expectedDeliveryText}
                        />
                    )}
                    */}
                </div>
                <div className="space-y-6">
                    <PaymentCard payment={order.payment} />
                    {order.returnRequest && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Yêu cầu trả hàng</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Hoàn tiền hàng: {order.returnRequest.refundAmount.toLocaleString('vi-VN')} đ
                                    </p>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
                                    order.returnRequest.status === 'PENDING' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                    order.returnRequest.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' :
                                        'bg-red-100 text-red-700 border-red-200'
                                }`}>
                                    {order.returnRequest.status === 'PENDING' ? 'Chờ duyệt' :
                                     order.returnRequest.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                                </span>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Lý do khách gửi</p>
                                    <p className="font-medium text-gray-900 whitespace-pre-wrap">{order.returnRequest.reason}</p>
                                </div>
                                {order.returnRequest.reviewNote && (
                                    <div>
                                        <p className="text-gray-500">Ghi chú xử lý</p>
                                        <p className="font-medium text-gray-900 whitespace-pre-wrap">{order.returnRequest.reviewNote}</p>
                                    </div>
                                )}
                                {order.returnRequest.imageUrls.length > 0 && (
                                    <div>
                                        <p className="text-gray-500 mb-2">Ảnh bằng chứng</p>
                                        <div className="flex flex-wrap gap-2">
                                            {order.returnRequest.imageUrls.map((url) => (
                                                <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-16 w-16 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={url} alt="Bằng chứng trả hàng" className="h-full w-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {order.returnRequest.status === 'PENDING' && (
                                    <div className="space-y-3 pt-2">
                                        <textarea
                                            value={returnReviewNote}
                                            onChange={(event) => setReturnReviewNote(event.target.value)}
                                            className="w-full min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                            placeholder="Ghi chú xử lý cho khách (tùy chọn)"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={handleRejectReturn}
                                                disabled={isReviewingReturn}
                                                className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                                            >
                                                Từ chối
                                            </button>
                                            <button
                                                onClick={handleApproveReturn}
                                                disabled={isReviewingReturn}
                                                className="px-3 py-2 rounded-lg border border-green-200 bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                                            >
                                                Duyệt trả hàng
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Thông tin vận chuyển</h3>
                                <p className="text-xs text-gray-500 mt-1">Mã vận đơn GHN: {shippingCode}</p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap">
                                {shippingStatusLabel}
                            </span>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500">Người nhận</p>
                                <p className="font-semibold text-gray-900">{receiverName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Số điện thoại</p>
                                <p className="font-semibold text-gray-900">{receiverPhone}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Địa chỉ giao hàng</p>
                                <p className="font-semibold text-gray-900">{receiverAddress}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <p className="text-gray-500">Dịch vụ vận chuyển</p>
                                    <p className="font-semibold text-gray-900">{shippingServiceName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Phí vận chuyển</p>
                                    <p className="font-semibold text-gray-900">{shippingFeeText}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500">Dự kiến giao</p>
                                <p className="font-semibold text-gray-900">{expectedDeliveryText}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isShipConfirmOpen}
                onClose={() => !isShipping && setIsShipConfirmOpen(false)}
                title="Xác nhận tạo đơn GHN"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Vui lòng kiểm tra thông tin vận chuyển trước khi tạo đơn giao hàng.
                    </p>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                        <div className="text-sm">
                            <div>
                                <p className="text-slate-500">Mã đơn hàng</p>
                                <p className="font-semibold text-slate-900">#{order.orderCode}</p>
                            </div>
                        </div>

                        <div className="text-sm">
                            <p className="text-slate-500">Người nhận</p>
                            <p className="font-semibold text-slate-900">{receiverName}</p>
                        </div>

                        <div className="text-sm">
                            <p className="text-slate-500">Số điện thoại</p>
                            <p className="font-semibold text-slate-900">{receiverPhone}</p>
                        </div>

                        <div className="text-sm">
                            <p className="text-slate-500">Địa chỉ giao hàng</p>
                            <p className="font-semibold text-slate-900">{receiverAddress}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-slate-500">Dịch vụ vận chuyển</p>
                                <p className="font-semibold text-slate-900">{shippingServiceName}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Phí vận chuyển</p>
                                <p className="font-semibold text-slate-900">{shippingFeeText}</p>
                            </div>
                        </div>

                        <div className="text-sm">
                            <p className="text-slate-500">Dự kiến giao</p>
                            <p className="font-semibold text-slate-900">{expectedDeliveryText}</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsShipConfirmOpen(false)}
                            disabled={isShipping}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleShip}
                            disabled={isShipping}
                            className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isShipping ? 'Đang tạo...' : 'Xác nhận tạo GHN'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OrderDetailsPage;
