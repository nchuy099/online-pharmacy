import { Link } from "react-router-dom";
import { FaLock, FaArrowLeft } from "react-icons/fa";

const ForbiddenPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-8 shadow-sm">
                    <FaLock className="w-10 h-10" />
                </div>
                
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">403 Forbidden</h1>
                
                <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">
                    Bạn không có quyền truy cập vào trang quản trị.
                </p>
                
                <div className="space-y-4">
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-[#001737] hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 text-sm uppercase tracking-widest"
                    >
                        <FaArrowLeft className="w-3.5 h-3.5" />
                        Đăng nhập bằng tài khoản khác
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForbiddenPage;
