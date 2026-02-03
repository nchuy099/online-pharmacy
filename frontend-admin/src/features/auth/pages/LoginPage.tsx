import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Error from "../components/Error";
import { useAuth } from "../hooks";
import Button from "../../../shared/components/ui/Button";
import { resolveApiErrorMessage } from "../../../shared/services/apiError";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const validate = () => {
        if (!email) return "Vui lòng nhập email";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Email không hợp lệ";
        if (!password) return "Vui lòng nhập mật khẩu";
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = validate();
        if (msg) {
            setError(msg);
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            await login(email, password);
            navigate("/");
        } catch (err: any) {
            setError(resolveApiErrorMessage(err, "Đăng nhập thất bại"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div>
                    <div className="mx-auto h-12 w-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Đăng nhập Quản trị
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Vui lòng đăng nhập bằng email và mật khẩu
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm`}
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm`}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                                autoComplete="current-password"
                            />
                        </div>
                        {error && <Error message={error} />}
                    </div>
                    <Button type="submit" variant="primary" fullWidth disabled={submitting}>
                        {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>
                </form>
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Hệ thống quản trị dành riêng cho nhân viên được ủy quyền
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
