import { useEffect, useMemo, useState } from 'react';
import { InventorySummary, InventoryVariantRow } from '../types/domain';

interface ImportStockDialogProps {
    isOpen: boolean;
    inventory?: InventoryVariantRow | InventorySummary | null;
    onClose: () => void;
    onConfirm: (variantId: string, quantity: number, unitCost: number, note?: string) => void;
    isLoading?: boolean;
}

const ImportStockDialog = ({ isOpen, inventory, onClose, onConfirm, isLoading = false }: ImportStockDialogProps) => {
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);
    const [unitCost, setUnitCost] = useState<number>(0);
    const [note, setNote] = useState<string>('');

    const variants: InventoryVariantRow[] = useMemo(() => {
        if (inventory == null) return [];
        if ('inventories' in inventory && Array.isArray(inventory.inventories)) {
            return inventory.inventories as InventoryVariantRow[];
        }
        return [inventory as InventoryVariantRow];
    }, [inventory]);

    const selectedVariant = useMemo(
        () => variants.find((v) => v.variantId === selectedVariantId) || variants[0],
        [variants, selectedVariantId]
    );

    const salePrice = selectedVariant?.salePrice || 0;
    const averageImportCost = selectedVariant?.averageImportCost || 0;
    const isImportHigherOrEqualSale = salePrice > 0 && unitCost >= salePrice;

    useEffect(() => {
        if (isOpen && variants.length > 0) {
            setSelectedVariantId(variants[0].variantId);
        }
    }, [isOpen, variants]);

    const handleConfirm = () => {
        if (selectedVariantId == null || selectedVariantId === '') {
            alert('Vui lòng chọn phân loại cần nhập kho');
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

        onConfirm(selectedVariantId, quantity, unitCost, note || undefined);
        setQuantity(0);
        setUnitCost(0);
        setNote('');
    };

    const handleClose = () => {
        setQuantity(0);
        setUnitCost(0);
        setNote('');
        onClose();
    };

    if (!isOpen || !inventory) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
            <div className="relative z-10 w-full max-w-xl bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900">Nhập kho</h3>
                <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Sản phẩm nhập kho</p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="font-semibold text-slate-800 leading-snug">{inventory.productWebName || inventory.productName}</p>
                        <p className="text-[10px] text-slate-400 mt-1 italic">Tên gốc: {inventory.productName}</p>
                    </div>
                </div>

                <div className="mt-4 space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Biến thể nhập kho</label>
                    {variants.length > 1 ? (
                        <select
                            value={selectedVariantId}
                            onChange={(e) => setSelectedVariantId(e.target.value)}
                            disabled={isLoading}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {variants.map((v) => (
                                <option key={v.variantId} value={v.variantId}>
                                    {(v.specification || v.unitType || 'Mặc định') + ' - ' + (v.productSku || '-')}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="w-full border border-gray-200 rounded-md px-3 py-2 bg-slate-50 text-sm text-slate-700">
                            {(selectedVariant?.specification || selectedVariant?.unitType || 'Mặc định') + ' - ' + (selectedVariant?.productSku || '-')}
                        </div>
                    )}
                </div>

                {selectedVariant && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500">
                                Giá bán hiện tại: <span className="font-semibold text-slate-700">{salePrice > 0 ? salePrice.toLocaleString() + ' đ' : 'N/A'}</span>
                            </span>
                            <span className="text-xs text-slate-500">
                                Giá nhập trung bình: <span className="font-semibold text-slate-700">{averageImportCost > 0 ? averageImportCost.toLocaleString() + ' đ' : 'N/A'}</span>
                            </span>
                        </div>
                    </div>
                )}

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng:</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                        disabled={isLoading}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                        min="0"
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập (mỗi đơn vị):</label>
                    <input
                        type="number"
                        value={unitCost}
                        onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value)))}
                        disabled={isLoading}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                        min="0"
                    />
                    {isImportHigherOrEqualSale && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                            Cảnh báo: Giá nhập đang lớn hơn hoặc bằng giá bán hiện tại.
                        </p>
                    )}
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú:</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={isLoading}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                        placeholder="Ghi chú nhập kho (tùy chọn)"
                    />
                </div>

                <div className="mt-6 flex items-center justify-end space-x-2">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || quantity <= 0}
                        className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Đang xử lý...' : 'Nhập'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportStockDialog;
