import { FaBaby, FaCapsules, FaComments, FaSprayCanSparkles, FaStethoscope, FaWheelchair } from "react-icons/fa6"
import { useChatContext } from "../../chat/context/ChatContext"

export const QuickActions = () => {
    const { openWidget } = useChatContext();

    return (
        <section className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {[
                    { icon: FaCapsules, label: 'Thuốc kê đơn' },
                    { icon: FaSprayCanSparkles, label: 'Thuốc không kê đơn' },
                    { icon: FaStethoscope, label: 'Thực phẩm chức năng' },
                    { icon: FaBaby, label: 'Mẹ & Bé' },
                    { icon: FaWheelchair, label: 'Người cao tuổi' },
                    { icon: FaComments, label: 'Tư vấn online', onClick: openWidget },
                ].map((item, idx) => (
                    <button
                        key={idx}
                        onClick={item.onClick}
                        className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-100 hover:border-emerald-300 hover:shadow-md hover:bg-emerald-50 transition-all active:scale-95"
                    >
                        <item.icon className="text-4xl text-emerald-600" />
                        <span className="text-sm font-medium text-gray-700 text-center">{item.label}</span>
                    </button>
                ))}
            </div>
        </section>
    )
}