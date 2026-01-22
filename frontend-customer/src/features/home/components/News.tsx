import { FaNewspaper } from "react-icons/fa6"

export const News = () => {
    return (
        <section className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-10">Kiến thức y tế</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'Cách dùng kháng sinh đúng cách', desc: 'Tìm hiểu cách sử dụng kháng sinh an toàn và hiệu quả...' },
                    { title: 'Phân biệt thuốc kê đơn & OTC', desc: 'Hiểu rõ sự khác nhau giữa hai loại thuốc này...' },
                    { title: 'Những lưu ý khi mua thuốc online', desc: 'Hướng dẫn chi tiết để mua thuốc an tâm...' },
                ].map((article, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                        <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                            <FaNewspaper className="text-emerald-600 text-6xl" />
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-gray-900 mb-2">{article.title}</h3>
                            <p className="text-gray-600 text-sm mb-4">{article.desc}</p>
                            <button className="text-emerald-600 hover:text-emerald-700 font-semibold">
                                Đọc thêm →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-center mt-10">
                <button className="px-8 py-3 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold rounded-lg transition-all">
                    Xem thêm kiến thức y tế →
                </button>
            </div>
        </section>
    )
}