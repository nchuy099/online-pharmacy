import { FaComments } from "react-icons/fa6"

export const Chatbot = () => {
    return (
        <>
            <section className="max-w-7xl mx-auto px-6 py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Bạn đang gặp triệu chứng gì?</h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Chatbot Smart Pharma sẽ gợi ý thuốc phù hợp & kết nối dược sĩ tư vấn
                    </p>
                    <button className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all inline-flex items-center gap-2">
                        <FaComments /> Bắt đầu chat
                    </button>
                </div>
            </section>

            {/* ========== FLOATING CHATBOT ========== */}
            <button className="fixed bottom-6 right-6 w-16 h-16 bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:scale-110 transition-all z-30" title="Hỏi dược sĩ 24/7">
                <FaComments className="text-2xl" />
            </button>

            {/* Footer spacing */}
            <div className="h-20"></div>
        </>
    )
}