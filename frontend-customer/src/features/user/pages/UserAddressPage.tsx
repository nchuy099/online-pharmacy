import React, { useState } from 'react';
import { AddressList } from '@/features/order/components/AddressList';
import { useAddressList } from '@/features/order/hooks/useAddressQuery';
import { FaLocationDot, FaPlus } from 'react-icons/fa6';
import { AddressFormModal } from '@/features/order/components/AddressFormModal';
import { useCreateAddress, useUpdateAddress } from '@/features/order/hooks/useAddressMutation';
import type { Address } from '@/features/order/types/domain';
import { extractApiMessage } from '@/features/order/utils/error';

const UserAddressPage: React.FC = () => {
    const { data: addresses, isLoading } = useAddressList();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

    const createMutation = useCreateAddress();
    const updateMutation = useUpdateAddress();

    const handleAddNew = () => {
        setSelectedAddress(null);
        setFormErrorMessage(null);
        setIsModalOpen(true);
    };

    const handleEdit = (address: Address) => {
        setSelectedAddress(address);
        setFormErrorMessage(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: any) => {
        setFormErrorMessage(null);
        try {
            if (selectedAddress) {
                await updateMutation.mutateAsync({ id: selectedAddress.id, ...data });
            } else {
                await createMutation.mutateAsync(data);
            }
            setIsModalOpen(false);
            setFormErrorMessage(null);
        } catch (error) {
            setFormErrorMessage(extractApiMessage(error, "Không thể lưu địa chỉ"));
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-8 md:p-12 border-b border-gray-50 bg-gray-50/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-[#001737] mb-2 font-primary">Quản lý sổ địa chỉ</h1>
                    <p className="text-gray-400 font-bold text-sm">Sử dụng địa chỉ của bạn để việc đặt hàng được thuận tiện hơn</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-[20px] font-black text-[15px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 shrink-0"
                >
                    <FaPlus className="text-sm" /> Thêm địa chỉ mới
                </button>
            </div>

            <div className="p-8 md:p-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(n => (
                            <div key={n} className="h-48 bg-gray-50 rounded-[32px] animate-pulse"></div>
                        ))}
                    </div>
                ) : addresses && (addresses as any).length > 0 ? (
                    <AddressList
                        addresses={addresses as any}
                        onEdit={handleEdit}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-48 h-48 bg-gray-50 rounded-full flex items-center justify-center mb-10 relative">
                            <FaLocationDot className="text-7xl text-gray-200" />
                            <div className="absolute top-1/4 right-1/4 animate-ping">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full blur-sm opacity-30"></div>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-[#001737] mb-3">Chưa có địa chỉ nào</h3>
                        <p className="text-gray-400 font-bold max-w-xs mx-auto mb-10">Thêm địa chỉ giao hàng để chúng tôi có thể phục vụ bạn nhanh chóng nhất.</p>
                        <button
                            onClick={handleAddNew}
                            className="text-emerald-600 font-black text-lg hover:underline transition-all"
                        >
                            + Thêm địa chỉ ngay
                        </button>
                    </div>
                )}
            </div>

            <AddressFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setFormErrorMessage(null);
                }}
                initialData={selectedAddress}
                onSubmit={handleFormSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                errorMessage={formErrorMessage}
            />
        </div>
    );
};

export default UserAddressPage;
