import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrderDetails } from "../hooks/useOrderDetails";
import { useUpdateDeliveryInfo } from "../hooks/useUpdateDeliveryInfo";
import { useCancelOrder } from "../hooks/useCancelOrder";
import { useCreateReturnRequest } from "../hooks/useCreateReturnRequest";
import { FaArrowLeft, FaFileAlt, FaCheckCircle, FaClock, FaTruck, FaTimesCircle, FaEdit, FaSync, FaMapMarkerAlt, FaUndo } from "react-icons/fa";
import { useAddressList } from "../hooks/useAddressQuery";
import { useCreateAddress, useUpdateAddress, useDeleteAddress } from "../hooks/useAddressMutation";
import { AddressListModal } from "../components/AddressListModal";
import { AddressFormModal } from "../components/AddressFormModal";
import type { Address, ShippingInfo } from "../types/domain";
import { OrderItemsList } from "../components/OrderItemsList";
import { OrderShippingInfo } from "../components/OrderShippingInfo";
import { OrderShipmentLogsModal } from "../components/OrderShipmentLogsModal";
import { OrderPaymentInfo } from "../components/OrderPaymentInfo";
import { OrderSummary } from "../components/OrderSummary";
import type { IconType } from "react-icons";
import { extractApiMessage } from "../utils/error";

interface StatusConfig {
    label: string;
    icon: IconType;
    color: string;
    bg: string;
    border: string;
}

interface PaymentStatusInfo {
    label: string;
    color: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
    PENDING_PAYMENT: { label: "Chờ thanh toán", icon: FaClock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    PENDING_CONFIRMATION: { label: "Chờ nhà thuốc xác nhận", icon: FaClock, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
    CONFIRMED: { label: "Nhà thuốc đã xác nhận", icon: FaCheckCircle, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    PROCESSING: { label: "Đang xử lý", icon: FaClock, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
    SHIPPING: { label: "Đang giao hàng", icon: FaTruck, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    DELIVERED: { label: "Đã giao hàng", icon: FaCheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    RETURN_REQUESTED: { label: "Đang yêu cầu trả hàng", icon: FaUndo, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
    RETURNED: { label: "Đã trả hàng", icon: FaUndo, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
    CANCELLED: { label: "Đã hủy", icon: FaTimesCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    CANCELED: { label: "Đã hủy", icon: FaTimesCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
};

const PAYMENT_STATUS_CONFIG: Record<string, PaymentStatusInfo> = {
    PENDING: { label: "Chờ thanh toán", color: "text-yellow-600" },
    PENDING_COLLECTION: { label: "Chờ thu tiền COD", color: "text-amber-600" },
    PARTIAL: { label: "Thanh toán một phần", color: "text-amber-600" },
    COMPLETED: { label: "Đã thanh toán", color: "text-emerald-600" },
    CANCELLED: { label: "Đã hủy", color: "text-red-600" },
    REFUND_PENDING: { label: "Chờ hoàn tiền", color: "text-orange-600" },
    REFUNDED: { label: "Đã hoàn tiền", color: "text-slate-600" }
};

export const OrderDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: order, isLoading, isError, refetch } = useOrderDetails(id);
    const updateDeliveryInfoMutation = useUpdateDeliveryInfo();
    const cancelOrderMutation = useCancelOrder();
    const createReturnRequestMutation = useCreateReturnRequest();
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isReturnOpen, setIsReturnOpen] = useState(false);
    const [isAddressListOpen, setIsAddressListOpen] = useState(false);
    const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
    const [isShipmentLogsOpen, setIsShipmentLogsOpen] = useState(false);

    const [cancelReason, setCancelReason] = useState("");
    const [returnReason, setReturnReason] = useState("");
    const [returnFiles, setReturnFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [updateNote, setUpdateNote] = useState("");
    const [addressFormErrorMessage, setAddressFormErrorMessage] = useState<string | null>(null);

    const { data: addressList } = useAddressList();
    const createAddressMutation = useCreateAddress();
    const updateAddressMutation = useUpdateAddress();
    const deleteAddressMutation = useDeleteAddress();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium font-primary">Đang tải thông tin đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (isError || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-md w-full">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 font-primary">Không tìm thấy đơn hàng</h2>
                    <p className="text-gray-500 mb-8">Đơn hàng không tồn tại hoặc đã bị xóa.</p>
                    <button
                        onClick={() => navigate("/products")}
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all"
                    >
                        Về trang sản phẩm
                    </button>
                </div>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[order.status as string] || STATUS_CONFIG.PENDING_CONFIRMATION;
    const StatusIcon = statusConfig.icon;
    const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.payment?.status as string] || PAYMENT_STATUS_CONFIG.PENDING;
    const canUpdate = order.status === "PENDING_PAYMENT" || order.status === "PENDING_CONFIRMATION";
    const canCancel = order.status === "PENDING_PAYMENT" || order.status === "PENDING_CONFIRMATION";
    const deliveredAtTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : 0;
    const canReturn = order.status === "DELIVERED"
        && !order.returnRequest
        && deliveredAtTime > 0
        && Date.now() <= deliveredAtTime + 7 * 24 * 60 * 60 * 1000;

    const amountFormatted = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(order.finalAmount);

    const openUpdateModal = () => {
        setActionError(null);
        setUpdateNote(order.note || "");
        setSelectedAddress(order.address ? {
            id: "", // dummy id
            fullName: order.address.fullName,
            phoneNumber: order.address.phoneNumber,
            address: order.address.address,
            provinceName: order.address.provinceName,
            districtName: order.address.districtName,
            wardName: order.address.wardName,
            isDefault: false
        } as Address : null);
        setIsUpdateOpen(true);
    };

    const handleUpdate = async () => {
        if (!id || isSubmitting) {
            return;
        }

        if (!selectedAddress && !updateNote.trim()) {
            setActionError("Vui lòng chọn địa chỉ hoặc nhập ghi chú để cập nhật.");
            return;
        }

        try {
            setIsSubmitting(true);
            setActionError(null);
            let shippingInfoParams: ShippingInfo | undefined = undefined;
            if (selectedAddress) {
                shippingInfoParams = {
                    fullName: selectedAddress.fullName,
                    phoneNumber: selectedAddress.phoneNumber,
                    address: selectedAddress.address,
                    provinceName: selectedAddress.provinceName,
                    districtName: selectedAddress.districtName,
                    wardName: selectedAddress.wardName
                };
            }
            await updateDeliveryInfoMutation.mutateAsync({
                orderId: id,
                shippingInfo: shippingInfoParams as ShippingInfo,
                note: updateNote.trim() || undefined
            });
            await refetch();
            setIsUpdateOpen(false);
        } catch {
            setActionError("Không thể cập nhật đơn hàng. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddressFormSubmit = async (data: {
        fullName: string;
        phoneNumber: string;
        address: string;
        ghnProvinceId: number;
        ghnDistrictId: number;
        ghnWardCode: string;
        provinceName: string;
        districtName: string;
        wardName: string;
        isDefault: boolean;
    }) => {
        setAddressFormErrorMessage(null);
        try {
            if (editingAddress) {
                await updateAddressMutation.mutateAsync({ id: editingAddress.id, ...data });
            } else {
                const newAddr = await createAddressMutation.mutateAsync(data);
                setSelectedAddress(newAddr);
            }
            setIsAddressFormOpen(false);
            setEditingAddress(null);
            setAddressFormErrorMessage(null);
        } catch (err) {
            setAddressFormErrorMessage(extractApiMessage(err, "Không thể lưu địa chỉ"));
        }
    };

    const openCancelModal = () => {
        setActionError(null);
        setCancelReason("");
        setIsCancelOpen(true);
    };

    const handleCancel = async () => {
        if (!id || isCancelling) {
            return;
        }

        try {
            setIsCancelling(true);
            setActionError(null);
            await cancelOrderMutation.mutateAsync({ orderId: id, reason: cancelReason.trim() || undefined });
            await refetch();
            setIsCancelOpen(false);
        } catch {
            setActionError("Không thể hủy đơn hàng. Vui lòng thử lại.");
        } finally {
            setIsCancelling(false);
        }
    };

    const openReturnModal = () => {
        setActionError(null);
        setReturnReason("");
        setReturnFiles([]);
        setIsReturnOpen(true);
    };

    const handleReturnRequest = async () => {
        if (!id || isReturning) {
            return;
        }
        if (!returnReason.trim()) {
            setActionError("Vui lòng nhập lý do trả hàng.");
            return;
        }
        if (returnFiles.length > 5) {
            setActionError("Chỉ được tải lên tối đa 5 ảnh bằng chứng.");
            return;
        }

        try {
            setIsReturning(true);
            setActionError(null);
            await createReturnRequestMutation.mutateAsync({
                orderId: id,
                reason: returnReason.trim(),
                files: returnFiles,
            });
            await refetch();
            setIsReturnOpen(false);
        } catch {
            setActionError("Không thể gửi yêu cầu trả hàng. Vui lòng thử lại.");
        } finally {
            setIsReturning(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] py-8 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 hover:shadow-md transition-all shrink-0"
                    >
                        <FaArrowLeft />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3">
                            <h1 className="text-2xl font-black text-[#001737] truncate">Chi tiết đơn hàng</h1>
                            <span className="text-[13px] text-slate-400 font-bold uppercase tracking-widest hidden md:block">Quản lý đơn hàng của bạn</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                            Mã đơn: #{order?.orderCode || order?.id?.slice(-12).toUpperCase()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 transition-all shrink-0"
                            title="Làm mới"
                        >
                            <FaSync className={isLoading ? "animate-spin text-emerald-600" : ""} />
                        </button>
                        <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border ${statusConfig.bg} ${statusConfig.border}`}>
                            <StatusIcon className={`${statusConfig.color} text-sm`} />
                            <span className={`text-[12px] font-black uppercase tracking-wider ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>
                    </div>
                </div>

                {/* Status for Mobile */}
                <div className={`md:hidden flex items-center justify-center gap-2 px-5 py-4 mb-8 rounded-2xl border-2 ${statusConfig.bg} ${statusConfig.border}`}>
                    <StatusIcon className={`${statusConfig.color} text-xl`} />
                    <span className={`font-bold ${statusConfig.color} text-lg`}>{statusConfig.label}</span>
                </div>

                {/* Action Buttons */}
                {(canUpdate || canCancel || canReturn) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {canUpdate && (
                            <button
                                onClick={openUpdateModal}
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[13px] bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaEdit />
                                Cập nhật thông tin đơn
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={openCancelModal}
                                disabled={isCancelling}
                                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[13px] bg-white border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaTimesCircle />
                                Hủy đơn hàng
                            </button>
                        )}
                        {canReturn && (
                            <button
                                onClick={openReturnModal}
                                disabled={isReturning}
                                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[13px] bg-white border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaUndo />
                                Yêu cầu trả hàng
                            </button>
                        )}
                        {actionError && (
                            <div className="sm:col-span-2 text-center text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">
                                {actionError}
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Items Section */}
                    {/* Items Section */}
                    <OrderItemsList items={order.items || []} orderStatus={order.status} />

                    {/* Shipping, Payment and Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <OrderShippingInfo
                            address={order.address}
                            expectedDeliveryTime={order.expectedDeliveryTime}
                            shipment={order.shipment}
                            onTrackClick={() => setIsShipmentLogsOpen(true)}
                        />

                        <OrderPaymentInfo
                            order={order}
                            paymentStatusConfig={paymentStatusConfig}
                        />

                        <OrderSummary
                            amountFormatted={amountFormatted}
                            shippingFee={order.shippingFee}
                        />
                    </div>

                    {/* Note Section */}
                    {order.note && (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                <FaFileAlt className="text-emerald-600" />
                                Ghi chú
                            </h2>
                            <p className="text-gray-600 leading-relaxed font-medium">{order.note}</p>
                        </div>
                    )}

                    {order.returnRequest && (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                <FaUndo className="text-orange-500" />
                                Yêu cầu trả hàng
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Trạng thái</p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {order.returnRequest.status === "PENDING"
                                            ? "Chờ duyệt"
                                            : order.returnRequest.status === "APPROVED"
                                                ? "Đã duyệt"
                                                : "Đã từ chối"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Số tiền hoàn dự kiến</p>
                                    <p className="font-bold text-gray-900 mt-1">
                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.returnRequest.refundAmount)}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Lý do</p>
                                    <p className="text-gray-700 mt-1 leading-relaxed">{order.returnRequest.reason}</p>
                                </div>
                                {order.returnRequest.reviewNote && (
                                    <div className="md:col-span-2">
                                        <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Phản hồi từ nhà thuốc</p>
                                        <p className="text-gray-700 mt-1 leading-relaxed">{order.returnRequest.reviewNote}</p>
                                    </div>
                                )}
                                {order.returnRequest.imageUrls.length > 0 && (
                                    <div className="md:col-span-2 flex flex-wrap gap-3">
                                        {order.returnRequest.imageUrls.map((url) => (
                                            <a key={url} href={url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-2xl overflow-hidden border border-gray-100">
                                                <img src={url} alt="Bằng chứng trả hàng" className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isUpdateOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Cập nhật đơn hàng</h3>
                        <p className="text-sm text-gray-500 mb-6">Cập nhật thông tin giao hàng hoặc ghi chú cho đơn.</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ nhận hàng</label>
                                {!selectedAddress ? (
                                    <button
                                        onClick={() => setIsAddressListOpen(true)}
                                        className="w-full p-6 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-all text-sm font-bold flex flex-col items-center gap-2"
                                    >
                                        <FaMapMarkerAlt className="text-xl" />
                                        Bấm để chọn địa chỉ nhận hàng
                                    </button>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 text-sm uppercase">{selectedAddress.fullName}</span>
                                                <span className="text-gray-400 text-xs text-bold tracking-tighter">| {selectedAddress.phoneNumber}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium line-clamp-1">{selectedAddress.address}, {selectedAddress.wardName}, {selectedAddress.districtName}, {selectedAddress.provinceName}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedAddress(null)}
                                                className="text-red-500 text-xs font-bold hover:underline py-1 px-3 bg-red-50 rounded-lg"
                                            >
                                                Xóa
                                            </button>
                                            <button
                                                onClick={() => setIsAddressListOpen(true)}
                                                className="text-emerald-600 text-xs font-bold hover:underline py-1 px-3 bg-emerald-50 rounded-lg"
                                            >
                                                Thay đổi
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú đơn hàng</label>
                                <textarea
                                    value={updateNote}
                                    onChange={(event) => setUpdateNote(event.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 outline-none resize-none min-h-[120px] transition-all text-sm"
                                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                                />
                            </div>
                        </div>

                        {actionError && (
                            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl">
                                {actionError}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsUpdateOpen(false)}
                                className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isSubmitting}
                                className="px-8 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCancelOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-3xl mb-4">
                                <FaTimesCircle />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Xác nhận hủy đơn</h3>
                            <p className="text-gray-500 mt-2">Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do hủy đơn (tùy chọn)</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(event) => setCancelReason(event.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none resize-none min-h-[100px] transition-all"
                                    placeholder="Nhập lý do bạn muốn hủy đơn hàng..."
                                />
                            </div>
                        </div>

                        {actionError && (
                            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl text-center">
                                {actionError}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-8">
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="w-full px-6 py-4 rounded-2xl bg-red-500 text-white font-black hover:bg-red-600 transition-all shadow-lg shadow-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isCancelling ? "Đang xử lý..." : "Xác nhận hủy đơn"}
                            </button>
                            <button
                                onClick={() => setIsCancelOpen(false)}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                            >
                                Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isReturnOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 text-3xl mb-4">
                                <FaUndo />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Yêu cầu trả hàng</h3>
                            <p className="text-gray-500 mt-2">Nhà thuốc sẽ kiểm tra yêu cầu trước khi xác nhận hoàn tiền và nhận lại hàng.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do trả hàng</label>
                                <textarea
                                    value={returnReason}
                                    onChange={(event) => setReturnReason(event.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none resize-none min-h-[120px] transition-all"
                                    placeholder="Mô tả tình trạng sản phẩm hoặc lý do bạn muốn trả hàng..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh bằng chứng (tùy chọn, tối đa 5 ảnh)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(event) => setReturnFiles(Array.from(event.target.files || []).slice(0, 5))}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:font-bold file:text-orange-600 hover:file:bg-orange-100"
                                />
                                {returnFiles.length > 0 && (
                                    <p className="mt-2 text-xs font-semibold text-gray-500">{returnFiles.length} ảnh đã chọn</p>
                                )}
                            </div>
                        </div>

                        {actionError && (
                            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl text-center">
                                {actionError}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-8">
                            <button
                                onClick={handleReturnRequest}
                                disabled={isReturning}
                                className="w-full px-6 py-4 rounded-2xl bg-orange-500 text-white font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isReturning ? "Đang gửi..." : "Gửi yêu cầu trả hàng"}
                            </button>
                            <button
                                onClick={() => setIsReturnOpen(false)}
                                className="w-full px-6 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                            >
                                Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isAddressListOpen && (
                <AddressListModal
                    isOpen={isAddressListOpen}
                    onClose={() => setIsAddressListOpen(false)}
                    addresses={addressList || []}
                    selectedId={selectedAddress?.id}
                    onSelect={(addr) => {
                        setSelectedAddress(addr);
                        setIsAddressListOpen(false);
                    }}
                    onAdd={() => {
                        setEditingAddress(null);
                        setAddressFormErrorMessage(null);
                        setIsAddressListOpen(false);
                        setIsAddressFormOpen(true);
                    }}
                    onEdit={(addr) => {
                        setEditingAddress(addr);
                        setAddressFormErrorMessage(null);
                        setIsAddressListOpen(false);
                        setIsAddressFormOpen(true);
                    }}
                    onDelete={async (id) => {
                        if (window.confirm("Xóa địa chỉ này?")) {
                            await deleteAddressMutation.mutateAsync(id);
                        }
                    }}
                />
            )}

            {isAddressFormOpen && (
                <AddressFormModal
                    isOpen={isAddressFormOpen}
                    onClose={() => {
                        setIsAddressFormOpen(false);
                        setAddressFormErrorMessage(null);
                    }}
                    onSubmit={handleAddressFormSubmit}
                    initialData={editingAddress}
                    isSubmitting={createAddressMutation.isPending || updateAddressMutation.isPending}
                    errorMessage={addressFormErrorMessage}
                />
            )}

            {isShipmentLogsOpen && (
                <OrderShipmentLogsModal
                    isOpen={isShipmentLogsOpen}
                    onClose={() => setIsShipmentLogsOpen(false)}
                    shipment={order.shipment}
                />
            )}
        </div>
    );
};
