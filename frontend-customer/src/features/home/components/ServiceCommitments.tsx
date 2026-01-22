import { FaCircleCheck, FaFileLines, FaLock, FaRocket } from "react-icons/fa6"

export const ServiceCommitments = () => {
    return (
        <section className="bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Cam kết của SmartPharma</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { icon: FaCircleCheck, label: 'Thuốc chính hãng 100%' },
                        { icon: FaRocket, label: 'Giao nhanh 2–4 giờ' },
                        { icon: FaFileLines, label: 'Đủ hóa đơn – chứng từ' },
                        { icon: FaLock, label: 'Bảo mật thông tin' },
                    ].map((item, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-5xl mb-4 flex justify-center text-emerald-600">
                                <item.icon />
                            </div>
                            <p className="text-gray-900 font-semibold">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

    )
}