import { FaComments, FaStethoscope } from "react-icons/fa6"
import { useChatContext } from "@/features/chat/context/ChatContext"

export const PharmacistChat = () => {
    const { openWidget } = useChatContext();
    return (
        <section className="max-w-7xl mx-auto px-6 py-16">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-12 flex items-center gap-8">
                <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
                    <FaStethoscope className="text-emerald-600 text-8xl" />
                </div>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Không chắc loại thuốc phù hợp?
                    </h2>
                    <p className="text-lg text-gray-700 mb-8">
                        Chat ngay với dược sĩ được cấp phép của SmartPharma. Chúng tôi sẵn sàng tư vấn 24/7 để giúp bạn lựa chọn thuốc đúng cách.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={openWidget}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                        >
                            <FaComments /> Chat với dược sĩ
                        </button>
                    </div>
                </div>
            </div>
        </section>

    )
}
