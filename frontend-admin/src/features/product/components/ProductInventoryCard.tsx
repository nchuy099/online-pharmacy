import React from 'react';
import { useNavigate } from 'react-router-dom';

interface InventoryInfo {
    id: string;
    quantityOnHand: number;
    quantityAvailable: number;
    quantityReserved: number;
}

interface ProductInventoryCardProps {
    inventoryInfo: InventoryInfo;
}

const ProductInventoryCard: React.FC<ProductInventoryCardProps> = ({ inventoryInfo }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Quản lý kho hàng</h2>
                        <p className="text-sm text-gray-500 mt-1">Theo dõi số lượng tồn kho và các giao dịch</p>
                    </div>
                    <button
                        onClick={() => navigate(`/inventories/${inventoryInfo.id}/transactions`)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all active:scale-95 border border-gray-200"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Lịch sử giao dịch
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Stock */}
                    <div className="relative group overflow-hidden bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg hover:shadow-blue-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md">Toàn bộ</span>
                        </div>
                        <p className="text-sm font-medium text-gray-500">Số lượng trên tay</p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-1">{inventoryInfo.quantityOnHand}</p>
                        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                    </div>

                    {/* Available Stock */}
                    <div className="relative group overflow-hidden bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md">Vận hành</span>
                        </div>
                        <p className="text-sm font-medium text-gray-500">Số lượng có sẵn</p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-1">{inventoryInfo.quantityAvailable}</p>
                        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                    </div>

                    {/* Reserved Stock */}
                    <div className="relative group overflow-hidden bg-white p-6 rounded-2xl border border-gray-100 hover:border-amber-200 transition-all hover:shadow-lg hover:shadow-amber-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded-md">Tạm khóa</span>
                        </div>
                        <p className="text-sm font-medium text-gray-500">Số lượng được đặt</p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-1">{inventoryInfo.quantityReserved}</p>
                        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductInventoryCard;
