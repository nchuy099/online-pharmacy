import { useNavigate } from "react-router-dom";
import { FaHome, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";

export const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-primary">
            <div className="max-w-2xl w-full text-center">
                {/* 404 Illustration placeholder/Icon */}
                <div className="relative mb-12">
                    <div className="text-[180px] font-black text-emerald-600/10 select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-emerald-600 rounded-3xl rotate-12 flex items-center justify-center shadow-xl shadow-emerald-200">
                            <FaExclamationTriangle className="text-white text-4xl -rotate-12" />
                        </div>
                    </div>
                </div>

                <h1 className="text-4xl font-black text-gray-900 mb-4">
                    Ối! Trang này không tồn tại
                </h1>
                <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                    Có vẻ như bạn đã đi lạc hoặc đường dẫn này đã bị thay đổi. Hãy để chúng tôi đưa bạn quay lại lộ trình đúng đắn nhé!
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate("/")}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95"
                    >
                        <FaHome />
                        Về trang chủ
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-700 font-bold rounded-2xl border-2 border-gray-100 hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm hover:scale-105 active:scale-95"
                    >
                        <FaArrowLeft />
                        Quay lại trang trước
                    </button>
                </div>

                {/* Helpful Links/Categories maybe? */}
                <div className="mt-16 pt-16 border-t border-gray-100">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Bạn có thể đang tìm kiếm</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {['Sản phẩm mới', 'Thuốc kê đơn', 'Thực phẩm chức năng', 'Thiết bị y tế'].map((item) => (
                            <button
                                key={item}
                                onClick={() => navigate("/products")}
                                className="px-5 py-2 bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 rounded-full text-sm font-medium transition-all"
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
