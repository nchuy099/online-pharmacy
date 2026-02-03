import { useAuth } from "../../auth/hooks";

const HomePage = () => {
    const { user } = useAuth();

    const displayName = user?.fullName || user?.name || "Người dùng";
    const role = user?.role || "N/A";

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 lg:p-8">
                <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-700">Trang chủ</p>
                <h1 className="mt-2 text-2xl lg:text-3xl font-black text-slate-900">
                    Xin chào, {displayName}
                </h1>
                <p className="mt-3 text-sm text-slate-600">
                    Bạn đã đăng nhập thành công vào hệ thống quản trị.
                </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Vai trò hiện tại</p>
                    <p className="mt-2 text-xl font-black text-emerald-600">{role}</p>
                </article>

                <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Hướng dẫn nhanh</p>
                    <p className="mt-2 text-sm text-slate-600">
                        Chọn chức năng ở thanh menu bên trái theo quyền của bạn để bắt đầu làm việc.
                    </p>
                </article>
            </section>
        </div>
    );
};

export default HomePage;
