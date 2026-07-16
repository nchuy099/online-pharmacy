import { useState, useMemo } from "react";
import { useOrderList } from "../hooks/useOrderList";
import { OrderCard } from "../components/OrderCard";
import { FaMagnifyingGlass, FaBoxOpen } from "react-icons/fa6";
import { Link } from "react-router-dom";

export const OrderHistoryPage = () => {
    const [activeTab, setActiveTab] = useState('all');
    const { orders, loading } = useOrderList();

    const tabs = [
        { id: 'all', label: 'Tất cả' },
        { id: 'processing', label: 'Đang xử lý' },
        { id: 'shipping', label: 'Đang giao' },
        { id: 'delivered', label: 'Đã giao' },
        { id: 'cancelled', label: 'Đã hủy' },
        { id: 'returned', label: 'Trả hàng' },
    ];

    const filteredOrders = useMemo(() => {
        if (activeTab === 'all') return orders;
        return orders.filter(order => {
            const status = order.status.toLowerCase();
            if (activeTab === 'processing') return status === 'pending' || status === 'pending_payment' || status === 'processing';
            if (activeTab === 'returned') return status === 'return_requested' || status === 'returned';
            return status === activeTab;
        });
    }, [orders, activeTab]);

    return (
        <div className="flex flex-col h-full">
            {/* Header Area */}
            <div className="p-8 border-b border-gray-50 bg-gray-50/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h1 className="text-2xl font-black text-[#001737]">Đơn hàng của tôi</h1>

                    <div className="relative flex-1 max-w-md group">
                        <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên đơn, mã đơn, hoặc tên sản phẩm..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-100/50 border border-gray-100 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all text-gray-900 group-hover:shadow-sm"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex-1 px-6 py-3 rounded-xl text-[14px] font-bold transition-all whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50'}
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8">
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-48 bg-gray-50 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredOrders.length > 0 ? (
                    <div className="space-y-6">
                        {filteredOrders.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-48 h-48 bg-gray-50 rounded-full flex items-center justify-center mb-8 relative">
                            <FaBoxOpen className="text-7xl text-gray-200" />
                            <div className="absolute top-1/4 right-1/4 animate-bounce">
                                <div className="w-4 h-4 bg-emerald-500 rounded-full blur-sm opacity-20"></div>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-[#001737] mb-2">Bạn chưa có đơn hàng nào.</h3>
                        <p className="text-gray-400 font-bold max-w-xs mx-auto mb-8">Cùng khám phá hàng ngàn sản phẩm tại SmartPharma nhé!</p>
                        <Link
                            to="/products"
                            className="px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                        >
                            Khám phá ngay
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};
