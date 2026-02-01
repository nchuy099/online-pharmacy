import { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaPlus, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { useAddressList } from "../hooks/useAddressQuery";
import { useCreateAddress, useUpdateAddress, useDeleteAddress } from "../hooks/useAddressMutation";
import { AddressListModal } from "./AddressListModal";
import { AddressFormModal } from "./AddressFormModal";
import { extractApiMessage } from "../utils/error";
import type { Address } from "../types/domain";

interface CheckoutAddressSectionProps {
    onAddressChange: (address: Address | null) => void;
}

export const CheckoutAddressSection = ({ onAddressChange }: CheckoutAddressSectionProps) => {
    const { data: addressList, isLoading: isLoadingList } = useAddressList();
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    // Modal states
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

    const createMutation = useCreateAddress();
    const updateMutation = useUpdateAddress();
    const deleteMutation = useDeleteAddress();

    // Set default or first address as selected when list is loaded
    useEffect(() => {
        if (!isLoadingList && addressList && addressList.length > 0 && !selectedAddress) {
            // Find default address from list
            const defaultAddress = addressList.find(addr => addr.isDefault);
            if (defaultAddress) {
                setSelectedAddress(defaultAddress);
            } else {
                // If no default, pick the first one
                setSelectedAddress(addressList[0]);
            }
        }
    }, [isLoadingList, addressList, selectedAddress]);

    // Force open form modal if no addresses and loading is done
    const isAddressMissing = !isLoadingList && (!addressList || addressList.length === 0);

    useEffect(() => {
        if (isAddressMissing) {
            setIsFormModalOpen(true);
        }
    }, [isAddressMissing]);

    // Notify parent when selected address changes
    useEffect(() => {
        onAddressChange(selectedAddress);
    }, [selectedAddress?.id, onAddressChange]);

    const handleAddAddress = () => {
        setEditingAddress(null);
        setFormErrorMessage(null);
        setIsFormModalOpen(true);
    };

    const handleEditAddress = (address: Address) => {
        setEditingAddress(address);
        setFormErrorMessage(null);
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = async (data: {
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
        setFormErrorMessage(null);

        try {
            if (editingAddress) {
                await updateMutation.mutateAsync({ id: editingAddress.id, ...data });
            } else {
                const newAddress = await createMutation.mutateAsync(data);
                if (!selectedAddress || data.isDefault || isAddressMissing) {
                    setSelectedAddress(newAddress);
                }
            }
            setIsFormModalOpen(false);
            setEditingAddress(null);
        } catch (error) {
            setFormErrorMessage(extractApiMessage(error, "Không thể lưu địa chỉ"));
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
            try {
                await deleteMutation.mutateAsync(id);
                if (selectedAddress?.id === id) {
                    setSelectedAddress(null);
                }
            } catch (error) {
                console.error("Delete address failed", error);
            }
        }
    };

    if (isLoadingList && !addressList) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded-lg"></div>
                <div className="h-20 bg-gray-100 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative">
            {/* Masking overlay when no address is selected */}
            {!selectedAddress && isAddressMissing && (
                <div className="absolute inset-x-0 -bottom-[2000px] top-0 bg-white/60 backdrop-blur-md z-40 rounded-3xl" />
            )}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
                    <FaMapMarkerAlt className="text-emerald-600 text-base" />
                    Địa chỉ nhận hàng
                </h2>
                {selectedAddress && (
                    <button
                        onClick={() => setIsListModalOpen(true)}
                        className="text-emerald-600 text-sm font-bold hover:underline"
                    >
                        Thay đổi
                    </button>
                )}
            </div>

            {!selectedAddress ? (
                <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <FaExclamationTriangle className="text-amber-500 text-3xl mb-4" />
                    <p className="text-gray-900 font-bold mb-2">Bạn chưa có địa chỉ nhận hàng</p>
                    <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">
                        Vui lòng thêm địa chỉ nhận hàng để tiếp tục thanh toán.
                    </p>
                    <button
                        onClick={handleAddAddress}
                        className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
                    >
                        <FaPlus />
                        Thêm địa chỉ ngay
                    </button>
                </div>
            ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-[16px] uppercase tracking-tight">{selectedAddress.fullName}</span>
                                <span className="text-gray-400 text-sm font-medium">| {selectedAddress.phoneNumber}</span>
                            </div>
                            <p className="text-gray-600 text-[14px] leading-relaxed font-medium">
                                {selectedAddress.fullAddress || [
                                    selectedAddress.address,
                                    selectedAddress.wardName,
                                    selectedAddress.districtName,
                                    selectedAddress.provinceName
                                ].filter(Boolean).join(", ")}
                            </p>
                            {selectedAddress.isDefault && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md mt-1">
                                    <FaCheckCircle className="text-[8px]" />
                                    Mặc định
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AddressListModal
                isOpen={isListModalOpen}
                onClose={() => setIsListModalOpen(false)}
                addresses={addressList || []}
                selectedId={selectedAddress?.id}
                onSelect={(addr) => {
                    setSelectedAddress(addr);
                    setIsListModalOpen(false);
                }}
                onAdd={() => {
                    setIsListModalOpen(false);
                    handleAddAddress();
                }}
                onEdit={(addr) => handleEditAddress(addr)}
                onDelete={handleDeleteAddress}
            />

            <AddressFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setFormErrorMessage(null);
                }}
                onSubmit={handleFormSubmit}
                initialData={editingAddress}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                required={isAddressMissing}
                errorMessage={formErrorMessage}
            />
        </div>
    );
};
