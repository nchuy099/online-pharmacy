import type { Address } from "../types/domain";
import { FaLocationDot, FaPhone, FaCircleCheck } from "react-icons/fa6";

type Props = {
    address: Address;
    onEdit?: (address: Address) => void;
}

export const AddressCard = ({ address, onEdit }: Props) => {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-200 transition-all group relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="font-black text-[#001737] uppercase tracking-wide text-[13px]">{address.fullName}</span>
                        {address.isDefault && (
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm uppercase">
                                <FaCircleCheck /> Mặc định
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                        <div className="flex items-center gap-2">
                            <FaPhone className="text-emerald-500 text-[12px]" />
                            <span className="font-bold text-gray-500 text-[13px]">{address.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaLocationDot className="text-emerald-500 text-[12px]" />
                            <p className="text-[13px] font-bold text-gray-400">
                                {address.address}, {address.wardName}, {address.districtName}, {address.provinceName}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end md:border-l md:border-gray-50 md:pl-6 shrink-0">
                    <button
                        onClick={() => onEdit?.(address)}
                        className="text-[13px] font-black text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                        Chỉnh sửa
                    </button>
                </div>
            </div>
        </div>
    );
};
