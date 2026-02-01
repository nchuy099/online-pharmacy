import { useState, useEffect } from "react";
import { FaTimes, FaUser, FaPhone, FaMapMarkerAlt, FaExclamationTriangle, FaChevronDown } from "react-icons/fa";
import type { Address } from "../types/domain";
import { useLocationData } from "../hooks/useLocationData";

type AddressFormField = "fullName" | "phoneNumber" | "province" | "district" | "ward" | "streetAddress";
type AddressFormErrors = Partial<Record<AddressFormField, string>>;

const isValidPhoneNumber = (value: string) => /^[0-9]+$/.test(value);

interface AddressFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
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
    }) => void;
    initialData?: Address | null;
    isSubmitting?: boolean;
    required?: boolean;
    errorMessage?: string | null;
}

export const AddressFormModal = ({ isOpen, onClose, onSubmit, initialData, isSubmitting, required, errorMessage }: AddressFormModalProps) => {
    const [fullName, setFullName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [isDefault, setIsDefault] = useState(required || false);
    const [fieldErrors, setFieldErrors] = useState<AddressFormErrors>({});

    const {
        provinces,
        districts,
        wards,
        selectedProvince,
        selectedDistrict,
        selectedWard,
        handleProvinceChange,
        handleDistrictChange,
        handleWardChange,
        resetLocation,
        loadProvinces,
        initializeWithAddress
    } = useLocationData();


    useEffect(() => {
        if (isOpen) {
            setFieldErrors({});
            if (initialData) {
                setFullName(initialData.fullName);
                setPhoneNumber(initialData.phoneNumber);
                setStreetAddress(initialData.address);
                setIsDefault(initialData.isDefault);

                initializeWithAddress(
                    initialData.ghnProvinceId,
                    initialData.ghnDistrictId,
                    initialData.ghnWardCode
                );
            } else {
                setFullName("");
                setPhoneNumber("");
                setStreetAddress("");
                setIsDefault(required || false);
                resetLocation();
                loadProvinces();
            }
        }
    }, [initialData, isOpen, required, initializeWithAddress, resetLocation, loadProvinces]);

    const clearFieldError = (field: AddressFormField) => {
        setFieldErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const validateForm = () => {
        const errors: AddressFormErrors = {};
        const trimmedFullName = fullName.trim();
        const trimmedPhoneNumber = phoneNumber.trim();
        const trimmedStreetAddress = streetAddress.trim();

        const province = provinces.find((p) => p.ghnProvinceId === selectedProvince);
        const district = districts.find((d) => d.ghnDistrictId === selectedDistrict);
        const ward = wards.find((w) => w.ghnWardCode === selectedWard);

        if (!trimmedFullName) {
            errors.fullName = "Họ và tên người nhận không được để trống.";
        }

        if (!trimmedPhoneNumber) {
            errors.phoneNumber = "Số điện thoại không được để trống.";
        } else if (!isValidPhoneNumber(trimmedPhoneNumber)) {
            errors.phoneNumber = "Số điện thoại chỉ được chứa chữ số.";
        } else if (trimmedPhoneNumber.length < 10 || trimmedPhoneNumber.length > 15) {
            errors.phoneNumber = "Số điện thoại phải có từ 10 đến 15 chữ số.";
        }

        if (!selectedProvince || !province) {
            errors.province = "Vui lòng chọn Tỉnh / Thành phố.";
        }

        if (!selectedDistrict || !district) {
            errors.district = "Vui lòng chọn Quận / Huyện.";
        }

        if (!selectedWard || !ward) {
            errors.ward = "Vui lòng chọn Phường / Xã.";
        }

        if (!trimmedStreetAddress) {
            errors.streetAddress = "Địa chỉ chi tiết không được để trống.";
        }

        return { errors, province, district, ward };
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { errors, province, district, ward } = validateForm();
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0 || !province || !district || !ward) {
            return;
        }

        onSubmit({
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim(),
            address: streetAddress.trim(),
            ghnProvinceId: province.ghnProvinceId,
            ghnDistrictId: district.ghnDistrictId,
            ghnWardCode: ward.ghnWardCode,
            provinceName: province.name,
            districtName: district.name,
            wardName: ward.name,
            isDefault
        });
    };

    const handleProvinceSelect = async (value: string) => {
        clearFieldError("province");
        clearFieldError("district");
        clearFieldError("ward");
        await handleProvinceChange(Number(value));
    };

    const handleDistrictSelect = async (value: string) => {
        clearFieldError("district");
        clearFieldError("ward");
        await handleDistrictChange(Number(value));
    };

    const handleWardSelect = (value: string) => {
        clearFieldError("ward");
        handleWardChange(value);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center px-4 py-4 sm:px-6 z-[100] animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col overflow-hidden">
                <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 flex justify-between items-start gap-4 shrink-0">
                    <h3 className="text-2xl font-bold text-gray-900">
                        {required ? "Thông tin nhận hàng" : initialData ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
                    </h3>
                    {!required && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-all">
                            <FaTimes size={24} />
                        </button>
                    )}
                </div>

                {required && (
                    <div className="mx-6 sm:mx-8 mb-4 bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm flex items-start gap-3 border border-emerald-100 shrink-0">
                        <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                        <p className="font-medium">Vui lòng cung cấp địa chỉ nhận hàng để chúng tôi có thể thiết lập đơn hàng cho bạn.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 sm:px-8 pb-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên người nhận</label>
                        <div className="relative">
                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    clearFieldError("fullName");
                                }}
                                aria-invalid={!!fieldErrors.fullName}
                                className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all ${fieldErrors.fullName
                                    ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                    : "border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                                    }`}
                                placeholder="Ví dụ: Nguyễn Văn A"
                            />
                        </div>
                        {fieldErrors.fullName && (
                            <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors.fullName}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại liên hệ</label>
                        <div className="relative">
                            <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                    clearFieldError("phoneNumber");
                                }}
                                aria-invalid={!!fieldErrors.phoneNumber}
                                className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all ${fieldErrors.phoneNumber
                                    ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                    : "border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                                    }`}
                                placeholder="Ví dụ: 0909000000"
                            />
                        </div>
                        {fieldErrors.phoneNumber && (
                            <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors.phoneNumber}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tỉnh / Thành phố</label>
                            <div className="relative">
                                <select
                                    value={selectedProvince}
                                    onChange={(e) => handleProvinceSelect(e.target.value)}
                                    aria-invalid={!!fieldErrors.province}
                                    className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all appearance-none cursor-pointer ${fieldErrors.province
                                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                        : "border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                                        }`}
                                >
                                    <option value="">Chọn Tỉnh / Thành phố</option>
                                    {provinces.map(p => (
                                        <option key={p.ghnProvinceId} value={p.ghnProvinceId}>{p.name}</option>
                                    ))}
                                </select>
                                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {fieldErrors.province && (
                                <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors.province}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Quận / Huyện</label>
                            <div className="relative">
                                <select
                                    disabled={!selectedProvince}
                                    value={selectedDistrict}
                                    onChange={(e) => handleDistrictSelect(e.target.value)}
                                    aria-invalid={!!fieldErrors.district}
                                    className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.district
                                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                        : "border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                                        }`}
                                >
                                    <option value="">Chọn Quận / Huyện</option>
                                    {districts.map(d => (
                                        <option key={d.ghnDistrictId} value={d.ghnDistrictId}>{d.name}</option>
                                    ))}
                                </select>
                                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {fieldErrors.district && (
                                <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors.district}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phường / Xã</label>
                            <div className="relative">
                                <select
                                    disabled={!selectedDistrict}
                                    value={selectedWard}
                                    onChange={(e) => handleWardSelect(e.target.value)}
                                    aria-invalid={!!fieldErrors.ward}
                                    className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.ward
                                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                        : "border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                                        }`}
                                >
                                    <option value="">Chọn Phường / Xã</option>
                                    {wards.map(w => (
                                        <option key={w.ghnWardCode} value={w.ghnWardCode}>{w.name}</option>
                                    ))}
                                </select>
                                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            {fieldErrors.ward && (
                                <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors.ward}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ chi tiết (Số nhà, tên đường)</label>
                        <div className="relative">
                            <FaMapMarkerAlt className="absolute left-4 top-3 text-gray-400" />
                            <textarea
                                rows={2}
                                value={streetAddress}
                                onChange={(e) => {
                                    setStreetAddress(e.target.value);
                                    clearFieldError("streetAddress");
                                }}
                                aria-invalid={!!fieldErrors.streetAddress}
                                className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all resize-none ${fieldErrors.streetAddress
                                    ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                                    : "border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"
                                    }`}
                                placeholder="Ví dụ: Số 123, đường ABC..."
                            />
                        </div>
                        {fieldErrors.streetAddress && (
                            <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors.streetAddress}</p>
                        )}
                    </div>

                    {!required && (
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={isDefault}
                                onChange={(e) => setIsDefault(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Đặt làm địa chỉ mặc định
                            </label>
                        </div>
                    )}
                    {errorMessage && (
                        <p className="text-sm font-medium text-red-600 mt-2">{errorMessage}</p>
                    )}

                    </div>

                    <div className="px-6 sm:px-8 pb-6 pt-4 border-t border-gray-100 bg-white shrink-0">
                        <div className="flex gap-3">
                            {!required && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                                >
                                    Hủy
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`${required ? 'w-full' : 'flex-1'} py-4 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-60`}
                            >
                                {isSubmitting ? "Đang lưu..." : required ? "Tiếp tục thanh toán" : initialData ? "Cập nhật" : "Lưu địa chỉ"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
