import React from "react";
import { FaIndustry } from "react-icons/fa";

interface Category {
    name: string;
}

interface Props {
    categories?: Category[];
    brand?: string;
    brandOrigin?: string;
    producer?: string;
    specification?: string;
    ageUse?: string;
    objectUse?: string[];
}

export const ProductSidebarSpecs: React.FC<Props> = ({
    categories,
    brand,
    brandOrigin,
    producer,
    specification,
    ageUse,
    objectUse
}) => {
    return (
        <div className="lg:col-span-4 space-y-6 min-w-0">
            {/* Manufacturing Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                    <FaIndustry className="text-emerald-600" /> Thông tin sản phẩm
                </h3>
                <div className="space-y-4">
                    <InfoRow label="Danh mục" value={categories?.map(c => c.name).join(', ')} />
                    <InfoRow label="Thương hiệu" value={brand} />
                    <InfoRow label="Xuất xứ" value={brandOrigin} />
                    <InfoRow label="Nhà sản xuất" value={producer} />
                    <InfoRow label="Quy cách" value={specification} />
                    {ageUse && <InfoRow label="Độ tuổi" value={ageUse} />}
                </div>
            </div>

            {/* Target Audience */}
            {objectUse && objectUse.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Đối tượng sử dụng</h3>
                    <div className="flex flex-wrap gap-2">
                        {objectUse.map((obj, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                                {obj}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-400 font-medium min-w-[100px] flex-shrink-0">{label}</span>
            <span className="text-sm font-semibold text-gray-800 break-words min-w-0 flex-1">{value}</span>
        </div>
    );
};
