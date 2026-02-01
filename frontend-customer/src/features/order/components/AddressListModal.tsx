import { FaTimes, FaPlus, FaPencilAlt, FaTrash, FaCheckCircle, FaMapMarkerAlt, FaPhone, FaUser } from "react-icons/fa";
import type { Address } from "../types/domain";

interface AddressListModalProps {
    isOpen: boolean;
    onClose: () => void;
    addresses: Address[];
    selectedId?: string;
    onSelect: (address: Address) => void;
    onAdd: () => void;
    onEdit: (address: Address) => void;
    onDelete: (id: string) => void;
}

export const AddressListModal = ({
    isOpen,
    onClose,
    addresses,
    selectedId,
    onSelect,
    onAdd,
    onEdit,
    onDelete
}: AddressListModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Danh sách địa chỉ</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-all">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-2 -mr-2 space-y-4">
                    {addresses.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500 font-medium">Bạn chưa có địa chỉ nào</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <div
                                key={addr.id}
                                className={`group relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${selectedId === addr.id
                                    ? "border-emerald-600 bg-emerald-50/30"
                                    : "border-gray-100 hover:border-emerald-200 hover:bg-gray-50/50"
                                    }`}
                                onClick={() => onSelect(addr)}
                            >
                                <div className="flex justify-between items-start pr-12">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900 flex items-center gap-2">
                                                <FaUser className="text-xs text-gray-400" />
                                                {addr.fullName}
                                            </span>
                                            {addr.isDefault && (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                    Mặc định
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <FaPhone className="text-xs text-gray-400" />
                                            {addr.phoneNumber}
                                        </p>
                                        <p className="text-sm text-gray-500 leading-relaxed flex items-start gap-2">
                                            <FaMapMarkerAlt className="text-xs text-gray-400 mt-1 flex-shrink-0" />
                                            {addr.fullAddress || [
                                                addr.address,
                                                addr.wardName,
                                                addr.districtName,
                                                addr.provinceName
                                            ].filter(Boolean).join(", ")}
                                        </p>
                                    </div>
                                    {selectedId === addr.id && (
                                        <FaCheckCircle className="text-emerald-600 text-xl flex-shrink-0 animate-in zoom-in duration-200" />
                                    )}
                                </div>

                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(addr);
                                        }}
                                        className="p-2 bg-white border border-gray-100 rounded-xl text-blue-500 hover:shadow-md transition-all scale-90 hover:scale-100"
                                    >
                                        <FaPencilAlt size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(addr.id);
                                        }}
                                        className="p-2 bg-white border border-gray-100 rounded-xl text-red-500 hover:shadow-md transition-all scale-90 hover:scale-100"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={onAdd}
                        className="w-full py-4 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-500 transition-all group active:scale-[0.98]"
                    >
                        <FaPlus className="text-sm group-hover:scale-110 transition-transform" />
                        Thêm địa chỉ mới
                    </button>
                </div>
            </div>
        </div>
    );
};
