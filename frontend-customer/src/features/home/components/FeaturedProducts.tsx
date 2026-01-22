import { FaFire } from "react-icons/fa6";
import { ProductCard } from "../../product/components/ProductCard";
import { useTrendingProducts } from "@/features/recommendation/hooks/useTrendingProducts";

export const FeaturedProductsSection = () => {
    const { products, loading } = useTrendingProducts(8);

    if (!loading && products.length === 0) {
        return null;
    }

    return (
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 bg-white rounded-[40px] shadow-sm mb-12 border border-gray-50">
            <div className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-[#001737] mb-2 uppercase tracking-tight">Sản phẩm nổi bật</h2>
                        <p className="text-gray-400 font-bold text-sm">Chất lượng hàng đầu cho sức khỏe của bạn</p>
                    </div>
                    <div className="flex bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100 self-start backdrop-blur-sm">
                        <span className="px-5 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 text-[10px] uppercase tracking-wider bg-white text-emerald-600 shadow-xl shadow-emerald-500/10">
                            <FaFire className="text-[12px]" /> Xu hướng
                        </span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-[320px] bg-gray-50 animate-pulse rounded-3xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.slice(0, 8).map((product) => (
                        <ProductCard key={product.id} product={product} disableViewTracking />
                    ))}
                </div>
            )}
        </section>
    );
};
