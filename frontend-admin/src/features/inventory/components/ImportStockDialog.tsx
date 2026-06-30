import { useEffect, useMemo, useState } from 'react';
import { InventorySummaryRow } from '../types/domain';

interface ImportStockDialogProps {
    isOpen: boolean;
    inventory?: InventorySummaryRow | null;
    variantOptions?: InventorySummaryRow[];
    onClose: () => void;
    onConfirm: (
        variantId: string,
        lotNumber: string,
        expiryDate: string,
        quantity: number,
        unitCost: number,
        note?: string
    ) => void;
    isLoading?: boolean;
}

const ImportStockDialog = ({
    isOpen,
    inventory,
    variantOptions = [],
    onClose,
    onConfirm,
    isLoading = false,
}: ImportStockDialogProps) => {
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [lotNumber, setLotNumber] = useState<string>('');
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);
    const [unitCost, setUnitCost] = useState<number>(0);
    const [note, setNote] = useState<string>('');

    const variants = useMemo(() => {
        if (variantOptions.length > 0) return variantOptions;
        if (inventory) return [inventory];
        return [];
    }, [inventory, variantOptions]);

    const selectedVariant = useMemo(
        () => variants.find((v) => v.variantId === selectedVariantId) || inventory || variants[0],
        [variants, selectedVariantId, inventory]
    );

    const salePrice = selectedVariant?.salePrice || 0;
    const averageImportCost = selectedVariant?.averageImportCost || 0;
    const isImportHigherOrEqualSale = salePrice > 0 && unitCost >= salePrice;

    useEffect(() => {
        if (isOpen) {
            setSelectedVariantId(inventory?.variantId || variants[0]?.variantId || '');
        }
    }, [inventory?.variantId, isOpen, variants]);

    const resetState = () => {
        setLotNumber('');
        setExpiryDate('');
        setQuantity(0);
        setUnitCost(0);
        setNote('');
    };

    const handleConfirm = () => {
        if (!selectedVariantId) {
            alert('Vui lòng chọn biến thể cần nhập kho');
            return;
        }
        if (lotNumber.trim() === '') {
            alert('Vui lòng nhập số lô');
            return;
        }
        if (expiryDate.trim() === '') {
            alert('Vui lòng chọn hạn sử dụng');
            return;
        }
        if (quantity <= 0) {
            alert('Số lượng phải lớn hơn 0');
            return;
        }
        if (unitCost < 0) {
            alert('Đơn giá không được âm');
            return;
        }

        onConfirm(selectedVariantId, lotNumber.trim(), expiryDate, quantity, unitCost, note || undefined);
        resetState();
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
            <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900">Nhập kho theo lô</h3>
                <p className="mt-1 text-sm text-slate-500">Hệ thống sẽ tạo lô mới hoặc cộng dồn vào lô hiện có theo `variant + lot number + expiry date`.</p>

                {selectedVariant && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="font-semibold text-slate-800 leading-snug">{selectedVariant.productWebName || selectedVariant.productName}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {(selectedVariant.specification || selectedVariant.unitType || 'Mặc định') + ' • SKU: ' + (selectedVariant.productSku || '-')}
                        </p>
                    </div>
                )}

                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Biến thể nhập kho</label>
                        <select
                            value={selectedVariantId}
                            onChange={(e) => setSelectedVariantId(e.target.value)}
                            disabled={isLoading}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {variants.map((variant) => (
                                <option key={variant.variantId} value={variant.variantId}>
                                    {(variant.productWebName || variant.productName) + ' • ' + (variant.specification || variant.unitType || 'Mặc định')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số lô</label>
                            <input
                                type="text"
                                value={lotNumber}
                                onChange={(e) => setLotNumber(e.target.value)}
                                disabled={isLoading}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="LOT-2026-001"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hạn sử dụng</label>
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                disabled={isLoading}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                            disabled={isLoading}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            min="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập mỗi đơn vị</label>
                        <input
                            type="number"
                            value={unitCost}
                            onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value)))}
                            disabled={isLoading}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            min="0"
                        />
                        <div className="mt-2 text-xs text-slate-500 space-y-1">
                            <p>Giá bán hiện tại: <span className="font-semibold text-slate-700">{salePrice > 0 ? `${salePrice.toLocaleString('vi-VN')} đ` : 'N/A'}</span></p>
                            <p>Giá nhập trung bình: <span className="font-semibold text-slate-700">{averageImportCost > 0 ? `${averageImportCost.toLocaleString('vi-VN')} đ` : 'N/A'}</span></p>
                        </div>
                        {isImportHigherOrEqualSale && (
                            <p className="mt-2 text-sm font-medium text-red-600">
                                Cảnh báo: giá nhập đang lớn hơn hoặc bằng giá bán hiện tại.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={isLoading}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[88px]"
                            placeholder="Ví dụ: Nhập từ NCC A"
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || quantity <= 0}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Đang xử lý...' : 'Nhập kho'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportStockDialog;
