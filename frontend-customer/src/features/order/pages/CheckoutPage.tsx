import { useSearchParams, useNavigate } from "react-router-dom"
import { useCreateCheckout } from "../hooks/useCreateCheckout"
import { useCallback, useEffect, useState } from "react"
import { FaShoppingBasket, FaArrowLeft, FaShieldAlt, FaExclamationTriangle, FaTruck } from "react-icons/fa"
import type { OrderMode, PaymentMethod } from "../types/order.constant"
import { PaymentSelection } from "../components/PaymentSelection"
import { useCreateOrder } from "../hooks/useCreateOrder"
import { CheckoutAddressSection } from "../components/CheckoutAddressSection"
import type { Address, Order, OrderCheckout } from "../types/domain"

export const CheckoutPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [orderError, setOrderError] = useState<string | null>(null);

    const { mutate: createOrder, isPending: isCreatingOrder } = useCreateOrder();
    const { mutate: createCheckout, isPending: isPendingCheckout, isError, error } = useCreateCheckout();

    const [checkoutData, setCheckoutData] = useState<OrderCheckout | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
    const [note, setNote] = useState("");
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

    const mode = searchParams.get("mode") as OrderMode || "CART";
    // Support both legacy productId and new variantId
    const variantId = searchParams.get("variantId");
    const productId = searchParams.get("productId");
    const quantity = Number(searchParams.get("quantity") || 1);
    const addressId = selectedAddress?.id;
    const selectedShippingMethod = checkoutData?.shippingMethods?.find((method) => method.serviceId === selectedServiceId)
        || checkoutData?.shippingMethods?.[0]
        || null;

    const handleAddressChange = useCallback((addr: Address | null) => {
        setSelectedAddress(prev => {
            if (prev?.id === addr?.id) return prev;
            return addr;
        });
    }, []);

    // Fetch checkout preview whenever relevant parameters change
    useEffect(() => {
        if (mode === "BUY_NOW" && !variantId && !productId) return;

        const buyNowItem = (variantId || productId)
            ? { variantId: variantId || productId || "", quantity }
            : undefined;

        createCheckout(
            {
                mode,
                buyNowItem,
                addressId,
                serviceId: selectedServiceId || undefined,
                note: note.trim() || undefined,
            },
            {
                onSuccess: (data: OrderCheckout) => {
                    setCheckoutData(data);
                    if (!selectedServiceId && data.shippingMethods?.length) {
                        setSelectedServiceId(data.shippingMethods[0].serviceId);
                    }
                }
            }
        );
    }, [mode, variantId, productId, quantity, addressId, selectedServiceId, note, createCheckout]);

    if (!checkoutData && isPendingCheckout) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium font-primary">Đang thiết lập đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-md w-full">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 font-primary">Không thể thiết lập đơn hàng</h2>
                    <p className="text-gray-500 mb-8">{(error as Error).message || "Đã có lỗi xảy ra trong quá trình thanh toán."}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (!checkoutData) return null;

    const handleCreateOrder = () => {
        if (!checkoutData) return;

        if (!selectedAddress) {
            setOrderError("Vui lòng chọn hoặc thêm địa chỉ nhận hàng.");
            return;
        }

        if (!selectedShippingMethod) {
            setOrderError("Vui lòng chọn phương thức vận chuyển.");
            return;
        }

        if (selectedShippingMethod.expectedDeliveryTime == null) {
            setOrderError("Không thể xác định thời gian giao hàng dự kiến.");
            return;
        }

        setOrderError(null);
        if (!checkoutData.checkoutQuoteId) {
            setOrderError("Vui lòng chọn địa chỉ và phương thức vận chuyển để tạo bản nháp đơn hàng.");
            return;
        }
        createOrder(
            {
                checkoutQuoteId: checkoutData.checkoutQuoteId,
                paymentMethod,
                mode,
                buyNowItem: mode === "BUY_NOW" && (variantId || productId)
                    ? { variantId: variantId || productId || "", quantity }
                    : undefined,
                note: note.trim() || undefined,
            },
            {
                onSuccess: (data: Order) => {
                    if (paymentMethod === "BANK_TRANSFER") {
                        navigate(`/orders/${data.id}/payment`);
                    } else {
                        navigate(`/orders/${data.id}/success`, { state: { orderData: data } });
                    }
                },
                onError: (err: Error) => {
                    setOrderError(err.message || "Đã có lỗi xảy ra khi tạo đơn hàng.");
                }
            }
        );
    };

    const subtotalFormatted = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(checkoutData.itemTotalAmount);

    const finalAmountFormatted = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(checkoutData.finalAmount);

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-600 hover:text-emerald-600 hover:shadow-md transition-all"
                    >
                        <FaArrowLeft />
                    </button>
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-2xl font-black text-gray-900">Thanh toán</h1>
                        <p className="text-[13px] text-gray-400 font-bold uppercase tracking-widest hidden md:block">Kiểm tra thông tin & Đặt hàng</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Items and Payment */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Address Section */}
                        <CheckoutAddressSection onAddressChange={handleAddressChange} />

                        {/* Items Section */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-3">
                                <FaShoppingBasket className="text-emerald-600 text-base" />
                                Sản phẩm ({checkoutData.items.length})
                            </h2>
                            <div className="divide-y divide-gray-50">
                                {checkoutData.items.map((item) => (
                                    <div key={item.variantId || item.productId} className="py-6 flex gap-4 first:pt-0 last:pb-0">
                                        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-50 overflow-hidden">
                                            {item.productImageUrl ? (
                                                <img src={item.productImageUrl} alt={item.productWebName || item.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-emerald-600 font-bold text-xl uppercase tracking-tighter">
                                                    {(item.productWebName || item.productName)?.charAt(0) || "P"}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">{item.productWebName || item.productName || `Sản phẩm`}</h3>
                                            {/* Variant info */}
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                {item.variantName && (
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        {item.variantName}
                                                    </span>
                                                )}
                                                {item.unit && (
                                                    <span className="text-xs text-gray-400 font-medium">
                                                        Đơn vị: {item.unit}
                                                    </span>
                                                )}
                                                {item.sku && (
                                                    <span className="text-[10px] text-gray-300 font-medium">
                                                        SKU: {item.sku}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <p className="text-gray-500">
                                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.unitPrice)} x {item.quantity}
                                                </p>
                                                <p className="font-bold text-gray-900">
                                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.unitPrice * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Method Selection */}
                        {checkoutData.shippingMethods && checkoutData.shippingMethods.length > 0 && (
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 font-primary">
                                    <FaTruck className="text-emerald-600" />
                                    Phương thức vận chuyển
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(checkoutData.shippingMethods || []).map((method) => (
                                        <div
                                            key={method.serviceId}
                                            onClick={() => setSelectedServiceId(method.serviceId)}
                                            className={`group relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${selectedServiceId === method.serviceId
                                                ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-50/20"
                                                : "border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md"
                                                }`}
                                        >
                                            {selectedServiceId === method.serviceId && (
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 flex items-center justify-center translate-x-8 -translate-y-8 rotate-45">
                                                    <div className="text-white -rotate-45 translate-y-3 -translate-x-1 font-bold text-[10px] tracking-widest uppercase">Select</div>
                                                </div>
                                            )}
                                            <div>
                                                <p className={`font-black tracking-tight transition-colors ${selectedServiceId === method.serviceId ? "text-emerald-700" : "text-gray-900"}`}>{method.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">GHN Express</p>
                                                {method.expectedDeliveryTime && (
                                                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                                                        Dự kiến nhận: {new Date(method.expectedDeliveryTime * 1000).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                            <p className={`mt-6 font-black text-lg ${selectedServiceId === method.serviceId ? "text-emerald-600" : "text-gray-900"}`}>
                                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(method.fee)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Selection */}
                        <PaymentSelection value={paymentMethod} onChange={setPaymentMethod} />

                        {/* Note Section */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Ghi chú đơn hàng</h2>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Nhập ghi chú cho đơn hàng (nếu có)..."
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:border-emerald-500 focus:outline-none resize-none text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                            {/* Loading Overlay */}
                            {isPendingCheckout && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <h2 className="text-lg font-black text-gray-900 mb-4">Tổng kết thanh toán</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-gray-600">
                                    <span className="font-medium">Tạm tính</span>
                                    <span className="font-bold text-gray-900">{subtotalFormatted}</span>

                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                    <span className="font-medium">Phí vận chuyển</span>
                                    {checkoutData.shippingFee && checkoutData.shippingFee > 0 ? (
                                        <span className="font-bold text-gray-900">
                                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(checkoutData.shippingFee)}
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 font-bold uppercase text-xs tracking-widest">Miễn phí</span>
                                    )}
                                </div>
                                <div className="pt-6 border-t border-gray-100 mt-6">
                                    <div className="flex justify-between items-end">
                                        <span className="font-bold text-gray-900">Tổng thanh toán</span>
                                        <span className="text-3xl font-black text-emerald-600 leading-none">
                                            {finalAmountFormatted}
                                        </span>
                                    </div>


                                    <p className="text-[10px] text-gray-400 text-right font-bold uppercase tracking-widest mt-2">
                                        (Đã bao gồm Thuế VAT)
                                    </p>
                                </div>
                            </div>

                            {orderError && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <FaExclamationTriangle className="flex-shrink-0" />
                                    <p className="text-xs font-bold">{orderError}</p>
                                </div>
                            )}

                            <button
                                onClick={handleCreateOrder}
                                disabled={isCreatingOrder || !checkoutData.checkoutQuoteId}
                                className="w-full mt-8 py-5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingOrder ? "Đang xử lý..." : "Đặt hàng ngay"}
                            </button>

                            <div className="mt-6 flex bg-emerald-50 rounded-2xl p-4 items-start gap-3">
                                <FaShieldAlt className="text-emerald-600 mt-1 flex-shrink-0" />
                                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                                    Thanh toán an toàn & bảo mật. Cam kết thuốc chính hãng 100%, có hóa đơn đầy đủ.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
