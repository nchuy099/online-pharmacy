import { FaMoneyBillWave, FaCreditCard, FaCheckCircle } from "react-icons/fa";
import type { PaymentMethod } from "../types/order.constant";

type Props = {
    value: PaymentMethod | null;
    onChange: (method: PaymentMethod) => void;
};

const METHODS: { id: PaymentMethod; label: string; description: string; icon: React.ReactNode }[] = [
    {
        id: "COD",
        label: "Thanh toán khi nhận hàng (COD)",
        description: "Thanh toán bằng tiền mặt khi nhận được hàng.",
        icon: <FaMoneyBillWave className="text-xl" />
    },
    {
        id: "BANK_TRANSFER",
        label: "Chuyển khoản ngân hàng (SePay)",
        description: "Thanh toán bằng cách chuyển khoản qua ngân hàng. Hệ thống tự động xác nhận sau 1-2 phút.",
        icon: <FaCreditCard className="text-xl" />
    }
];

export const PaymentSelection = ({ value, onChange }: Props) => {
    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Phương thức thanh toán</h2>
            <div className="space-y-4">
                {METHODS.map((m) => {
                    const isActive = value === m.id;
                    return (
                        <div
                            key={m.id}
                            onClick={() => onChange(m.id)}
                            className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group ${isActive
                                ? "border-emerald-500 bg-emerald-50/30"
                                : "border-gray-50 hover:border-emerald-200 hover:bg-gray-50/50"
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                                }`}>
                                {m.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`font-bold transition-all ${isActive ? "text-emerald-900" : "text-gray-900"}`}>
                                        {m.label}
                                    </h3>
                                    {isActive && <FaCheckCircle className="text-emerald-500" />}
                                </div>
                                <p className={`text-xs leading-relaxed transition-all ${isActive ? "text-emerald-700/70" : "text-gray-400"}`}>
                                    {m.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};