import { useEffect, useState } from "react";

type Props = {
    isOpen: boolean;
    onCancel: () => void;
    onStockIn: (quantity: number, note?: string) => void;
    onStockOut: (quantity: number, note?: string) => void;
};

const StockAdjustDialog = ({ isOpen, onCancel, onStockIn, onStockOut }: Props) => {
    const [quantity, setQuantity] = useState<number>(0);
    const [note, setNote] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            setQuantity(0);
            setNote("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleIn = () => {
        if (quantity > 0) onStockIn(quantity, note);
    };

    const handleOut = () => {
        if (quantity > 0) onStockOut(quantity, note);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-base font-semibold text-gray-900">Nhập/Xuất kho</h3>
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[96px]" placeholder="Lý do nhập/xuất kho" />
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end space-x-2">
                    <button onClick={onCancel} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleOut} className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700">Stock Out</button>
                    <button onClick={handleIn} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Stock In</button>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustDialog;


