import React from 'react';
import { ProductVariant } from '../types/domain';
import { useNavigate } from 'react-router-dom';
import { useProductVariantActions } from '../hooks/useProduct';
import { notificationBus } from '../../notification';

interface Props {
    productId: string;
    variants: ProductVariant[];
    unitTypeOptions: string[];
    onChanged?: () => Promise<void> | void;
    isLoading?: boolean;
}

const ProductVariantsSection: React.FC<Props> = ({ productId, variants, unitTypeOptions, onChanged, isLoading = false }) => {
    const navigate = useNavigate();
    const { createVariant, updateVariant, deleteVariant, isLoading: isSubmitting } = useProductVariantActions();
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingVariantId, setEditingVariantId] = React.useState<string | null>(null);
    const [form, setForm] = React.useState({
        sku: '',
        unitType: '',
        specification: '',
        salePrice: '',
        isDefault: false,
        isActive: true,
    });

    const parsePriceInput = (value: string) => value.replace(/\D/g, '');
    const formatPriceInput = (value: string) => {
        if (!value) return '';
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '';
        return numeric.toLocaleString('vi-VN');
    };

    const resetForm = () => {
        setIsFormOpen(false);
        setEditingVariantId(null);
        setForm({
            sku: '',
            unitType: '',
            specification: '',
            salePrice: '',
            isDefault: false,
            isActive: true,
        });
    };

    const openCreate = () => {
        setIsFormOpen(true);
        setEditingVariantId(null);
        setForm({
            sku: '',
            unitType: '',
            specification: '',
            salePrice: '',
            isDefault: false,
            isActive: true,
        });
    };

    const openEdit = (variant: ProductVariant) => {
        setIsFormOpen(true);
        setEditingVariantId(variant.id);
        setForm({
            sku: variant.sku || '',
            unitType: variant.unitType || '',
            specification: variant.specification || '',
            salePrice: String(variant.salePrice ?? ''),
            isDefault: Boolean(variant.isDefault),
            isActive: variant.isActive ?? true,
        });
    };

    const submitForm = async () => {
        const price = Number(form.salePrice || '0');
        if (!form.unitType.trim()) {
            notificationBus.error('Vui lòng chọn đơn vị đóng gói');
            return;
        }
        if (!Number.isFinite(price) || price <= 0) {
            notificationBus.error('Giá bán phải lớn hơn 0');
            return;
        }

        try {
            if (editingVariantId) {
                await updateVariant(productId, editingVariantId, {
                    sku: form.sku.trim() || undefined,
                    unitType: form.unitType.trim(),
                    specification: form.specification.trim(),
                    salePrice: price,
                    isDefault: form.isDefault,
                    isActive: form.isActive,
                });
                notificationBus.success('Cập nhật phân loại thành công');
            } else {
                await createVariant(productId, {
                    sku: form.sku.trim() || undefined,
                    unitType: form.unitType.trim(),
                    specification: form.specification.trim(),
                    salePrice: price,
                    isDefault: form.isDefault,
                    isActive: form.isActive,
                });
                notificationBus.success('Thêm phân loại thành công');
            }
            resetForm();
            await onChanged?.();
        } catch (error: any) {
            notificationBus.error(error?.message || 'Thao tác phân loại thất bại');
        }
    };

    const handleDelete = async (variant: ProductVariant) => {
        if (!window.confirm(`Xóa phân loại ${variant.sku}?`)) {
            return;
        }
        try {
            await deleteVariant(productId, variant.id);
            notificationBus.success('Xóa phân loại thành công');
            await onChanged?.();
        } catch (error: any) {
            notificationBus.error(error?.message || 'Xóa phân loại thất bại');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Quản lý biến thể</h2>
                        <p className="text-sm text-gray-500 mt-1">Giá bán và tồn kho theo từng biến thể</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                        + Thêm phân loại
                    </button>
                </div>

                {isFormOpen && (
                <div className="mb-4 border border-gray-200 rounded-xl p-3 bg-gray-50/40">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-600">SKU</label>
                            <input
                                type="text"
                                value={form.sku}
                                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                                className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm"
                                placeholder="Tự sinh nếu bỏ trống"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-600">Đơn vị</label>
                            <select
                                value={form.unitType}
                                onChange={(e) => setForm((prev) => ({ ...prev, unitType: e.target.value }))}
                                className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm"
                                disabled={isSubmitting}
                            >
                                <option value="">Chọn đơn vị đóng gói</option>
                                {unitTypeOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-600">Quy cách</label>
                            <input
                                type="text"
                                value={form.specification}
                                onChange={(e) => setForm((prev) => ({ ...prev, specification: e.target.value }))}
                                className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm"
                                placeholder="Ví dụ: Hộp 10 vỉ x 10 viên"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-600">Giá bán (đ)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatPriceInput(form.salePrice)}
                                onChange={(e) => setForm((prev) => ({ ...prev, salePrice: parsePriceInput(e.target.value) }))}
                                className="w-full border-gray-200 rounded-lg px-3 py-2 text-sm"
                                placeholder="Ví dụ: 120.000"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={form.isDefault}
                                    onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                                    disabled={isSubmitting}
                                />
                                Mặc định
                            </label>
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                                    disabled={isSubmitting}
                                />
                                Hoạt động
                            </label>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            onClick={submitForm}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-semibold disabled:opacity-50"
                        >
                            {editingVariantId ? 'Lưu phân loại' : 'Tạo phân loại'}
                        </button>
                        <button
                            onClick={resetForm}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
                )}

                {isLoading ? (
                    <div className="py-8 text-center text-gray-500">Đang tải dữ liệu...</div>
                ) : variants.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">Không có phân loại nào cho sản phẩm này.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-[11px] border-y border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Phân loại</th>
                                    <th className="px-4 py-3">Mã SKU</th>
                                    <th className="px-4 py-3">Quy cách</th>
                                    <th className="px-4 py-3 border-l border-gray-200">Tồn kho / Khả dụng</th>
                                    <th className="px-4 py-3">Giá bán</th>
                                    <th className="px-4 py-3 border-l border-gray-200">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {variants.map((v) => (
                                    <tr key={v.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-900">{v.unitType}</td>
                                        <td className="px-4 py-3 min-w-[120px]">
                                            <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                                                {v.sku}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 min-w-[100px]">{v.specification || "-"}</td>
                                        <td className="px-4 py-3 border-l border-gray-100 min-w-[140px]">
                                            <div className="flex flex-col gap-1">
                                                <span>{v.quantityOnHand?.toLocaleString() || 0} tổng</span>
                                                <span className="font-bold text-gray-900">{v.quantityAvailable?.toLocaleString() || 0} khả dụng</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 min-w-[120px]">
                                            <div className="font-bold text-emerald-600">{Number(v.salePrice).toLocaleString('vi-VN')} đ</div>
                                        </td>
                                        <td className="px-4 py-3 border-l border-gray-100 min-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => navigate(`/inventories/${v.id}/transactions`)} className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors text-xs font-semibold border border-blue-100">
                                                    Lịch sử kho
                                                </button>
                                                <button
                                                    onClick={() => openEdit(v)}
                                                    className="px-2.5 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-xs font-semibold border border-slate-200"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(v)}
                                                    className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md transition-colors text-xs font-semibold border border-red-200"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductVariantsSection;
