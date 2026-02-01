import React from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingBasket, FaArrowLeft, FaSyncAlt } from "react-icons/fa";
import { CartList } from "../components/CartList";
import { CartSummary } from "../components/CartSummary";
import { useCart } from "../hooks/useCart";

export const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useCart(10);

    const allItems = data?.pages.flatMap(page => page.items) || [];
    const lastPage = data?.pages && data.pages.length > 0 ? data.pages[data.pages.length - 1] : undefined;

    const totalDistinctItemsTotal = lastPage?.totalItems || 0;
    const selectedTotal = lastPage?.selectedTotal || 0;
    const selectedCount = lastPage?.selectedCount || 0;

    const handleCheckout = () => {
        navigate(`/checkout?mode=CART`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium font-primary">Đang tải giỏ hàng...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-md w-full">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 font-primary">Đã có lỗi xảy ra</h2>
                    <p className="text-gray-500 mb-8">{(error as Error).message || "Không thể tải thông tin giỏ hàng."}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (allItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 px-6">
                <div className="max-w-xl mx-auto text-center bg-white rounded-3xl p-12 shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                        <FaShoppingBasket className="text-3xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 font-primary">Giỏ hàng của bạn đang trống</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Hãy quay lại danh sách sản phẩm và chọn cho mình những loại thuốc chất lượng nhất.
                    </p>
                    <button
                        onClick={() => navigate("/products")}
                        className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]"
                    >
                        Tiếp tục mua sắm
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 md:py-10 pb-32">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100 transition-all flex-shrink-0 shadow-sm"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#001737]">Giỏ hàng</h1>
                        <p className="text-xs md:text-sm text-gray-500 font-bold mt-1">
                            Có <span className="text-emerald-600">{totalDistinctItemsTotal}</span> sản phẩm trong giỏ
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Items List */}
                    <div className="lg:col-span-8 space-y-4">
                        <CartList items={allItems} />

                        {hasNextPage && lastPage?.nextCursor && (
                            <div className="flex justify-center pt-6">
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isFetchingNextPage ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                            Đang tải...
                                        </>
                                    ) : (
                                        <>
                                            <FaSyncAlt className="text-xs" />
                                            Xem thêm sản phẩm
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-4 block">
                        <CartSummary
                            grandTotal={selectedTotal}
                            totalDistinctItems={selectedCount}
                            onCheckout={handleCheckout}
                            isCartEmpty={allItems.length === 0}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
