import React, { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaTableCells, FaListUl, FaCapsules, FaChevronLeft } from "react-icons/fa6";
import { useProductList } from "../hooks/useProductList";
import { ProductCard } from "../components/ProductCard";
import { useCategories } from "../hooks/useCategories";
import type { Category } from '../types/domain';
import { ProductsFilterSidebar } from "../components/ProductsFilterSidebar";
import { Level2CategoryList } from "../components/Level2CategoryList";
import { ListViewProductCard } from "../components/ListViewProductCard";
import { CategoryExplorer } from "../components/CategoryExplorer";
import { ProductBreadcrumb } from "../components/ProductBreadcrumb";
import type { ProductSortBy } from "../services/product.service";

const PRICE_RANGES = [
    { label: "Dưới 100.000đ", min: 0, max: 100000 },
    { label: "100.000đ đến 300.000đ", min: 100000, max: 300000 },
    { label: "300.000đ đến 500.000đ", min: 300000, max: 500000 },
    { label: "Trên 500.000đ", min: 500000, max: 999999999 }
];

const SORT_OPTIONS: { id: ProductSortBy; label: string }[] = [
    { id: 'popular', label: 'Bán chạy' },
    { id: 'price-low', label: 'Giá thấp' },
    { id: 'price-high', label: 'Giá cao' }
];

const getPaginationArray = (currentPage: number, totalPages: number) => {
    const delta = 1;
    const pages: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - delta && i <= currentPage + delta)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }
    return pages;
};

const ProductsPage: React.FC = () => {
    const { "*": urlSlug } = useParams<{ "*": string }>();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<ProductSortBy>('popular');
    const [priceRange, setPriceRange] = useState<{ min?: number, max?: number }>({});

    const [activeSlug, setActiveSlug] = useState<string | undefined>(urlSlug);
    useEffect(() => {
        setActiveSlug(urlSlug);
    }, [urlSlug]);

    const { data: categories } = useCategories();

    const { rootCategory, currentActiveCategory, parentOfActive } = useMemo(() => {
        if (!categories) return { rootCategory: null, currentActiveCategory: null, parentOfActive: null };
        let root: Category | null = null;
        let active: Category | null = null;
        let parent: Category | null = null;
        for (const c1 of categories) {
            if (urlSlug?.startsWith(c1.slug)) root = c1;
            if (c1.slug === activeSlug) active = c1;
            if (c1.children) {
                for (const c2 of c1.children) {
                    if (c2.slug === activeSlug) { active = c2; parent = c1; }
                    if (c2.children) {
                        for (const c3 of c2.children) {
                            if (c3.slug === activeSlug) { active = c3; parent = c2; }
                        }
                    }
                }
            }
        }
        return { rootCategory: root, currentActiveCategory: active, parentOfActive: parent };
    }, [categories, urlSlug, activeSlug]);

    const level2Categories = useMemo(() => rootCategory?.children || [], [rootCategory]);
    const activeLevel2 = useMemo(() => {
        if (!currentActiveCategory) return null;
        if (currentActiveCategory.level === 1) return currentActiveCategory;
        if (currentActiveCategory.level === 2) return currentActiveCategory;
        if (currentActiveCategory.level === 3) return parentOfActive;
        return null;
    }, [currentActiveCategory, parentOfActive]);


    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || undefined;

    const { products, pagination, loading, page, setPage } = useProductList(1, activeSlug === 'products' ? undefined : activeSlug, sortBy, priceRange.min, priceRange.max, searchQuery);

    const handlePageChange = (newPage: number) => {
        if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleCategorySelect = (slug: string) => {
        setActiveSlug(slug);
        setPage(1);
    };



    const handlePriceRangeSelect = (min?: number, max?: number) => {
        if (priceRange.min === min && priceRange.max === max) {
            setPriceRange({});
        } else {
            setPriceRange({ min, max });
        }
        setPage(1);
    };

    const resetFilters = () => {
        setActiveSlug(rootCategory?.slug);
        setPriceRange({});
        setSortBy('popular');
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9]">
            <ProductBreadcrumb categories={rootCategory ? [rootCategory] : []} />
            <div className="max-w-7xl mx-auto px-6 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 mb-6 gap-4">
                    <h1 className="text-[28px] font-black text-[#001737] flex items-center gap-4">
                        <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                        {searchQuery
                            ? <>Kết quả cho <span className="text-emerald-600">"{searchQuery}"</span></>
                            : (rootCategory?.name || "Danh mục sản phẩm")
                        }
                    </h1>
                </div>

                {(!rootCategory || urlSlug === 'products') && !searchQuery ? (
                    <CategoryExplorer categories={categories || []} />
                ) : (
                    <>
                        <Level2CategoryList
                            categories={level2Categories}
                            activeSlug={activeLevel2?.slug}
                            onCategorySelect={handleCategorySelect}
                        />

                        <div className="grid grid-cols-12 gap-8">
                            <ProductsFilterSidebar
                                priceRange={priceRange}
                                onPriceRangeSelect={handlePriceRangeSelect}
                                onResetFilters={resetFilters}
                                priceRanges={PRICE_RANGES}
                            />

                            <main className="col-span-12 lg:col-span-9">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-[#001737] mb-1">Danh sách sản phẩm</h2>
                                        <p className="text-[13px] font-bold text-gray-400 italic">Lưu ý: Thuốc kê đơn và một số sản phẩm sẽ cần tư vấn từ dược sĩ</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Sắp xếp:</span>
                                        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                                            {SORT_OPTIONS.map((opt) => (
                                                <button key={opt.id} onClick={() => setSortBy(opt.id)} className={`px-5 py-2 rounded-xl text-[13px] font-black transition-all whitespace-nowrap ${sortBy === opt.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-emerald-600'}`}>{opt.label}</button>
                                            ))}
                                        </div>
                                        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                                            <button onClick={() => setViewMode('grid')} title="Dạng lưới" className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-300'}`}><FaTableCells className="text-base" /></button>
                                            <button onClick={() => setViewMode('list')} title="Dạng danh sách" className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-300'}`}><FaListUl className="text-base" /></button>
                                        </div>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-8`}>
                                        {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-[400px] bg-white border border-gray-100 rounded-[40px] animate-pulse"></div>)}
                                    </div>
                                ) : products.length > 0 ? (
                                    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-5 mb-12`}>
                                        {products.map((product) => (
                                            viewMode === 'grid' ? (
                                                <ProductCard key={product.id} product={product} showPurchaseControls sortBy={sortBy} />
                                            ) : (
                                                <ListViewProductCard
                                                    key={product.id}
                                                    product={product}
                                                    showPurchaseControls
                                                    sortBy={sortBy}
                                                />
                                            )
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[48px] py-32 text-center border border-gray-100 shadow-sm"><FaCapsules className="text-7xl text-gray-100 mx-auto mb-8" /><h3 className="text-2xl font-black text-[#001737] mb-3">Chưa có sản phẩm nào</h3><p className="text-gray-400 font-bold max-w-sm mx-auto">Chúng tôi đang cập nhật sản phẩm cho danh mục này. Vui lòng quay lại sau.</p></div>
                                )}

                                {!loading && pagination && pagination.totalPages > 1 && (
                                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-12 mb-24">
                                        <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="w-10 h-10 sm:w-14 sm:h-14 bg-white border border-gray-100 rounded-xl sm:rounded-2xl text-gray-400 hover:text-emerald-600 disabled:opacity-30 flex items-center justify-center transition-all shadow-sm hover:shadow-md"><FaChevronLeft className="text-sm sm:text-base" /></button>

                                        {getPaginationArray(page, pagination.totalPages).map((p, i) => {
                                            if (p === '...') {
                                                return <span key={`dot-${i}`} className="px-1 sm:px-2 text-gray-400 font-bold tracking-widest">...</span>;
                                            }
                                            return (
                                                <button key={`page-${p}`} onClick={() => handlePageChange(p as number)} className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base transition-all ${page === p ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 sm:ring-4 ring-emerald-500/10" : "bg-white border border-gray-100 text-gray-400 hover:text-emerald-600 shadow-sm"}`}>{p}</button>
                                            )
                                        })}

                                        <button onClick={() => handlePageChange(page + 1)} disabled={page === pagination.totalPages} className="w-10 h-10 sm:w-14 sm:h-14 bg-white border border-gray-100 rounded-xl sm:rounded-2xl text-gray-400 hover:text-emerald-600 disabled:opacity-30 flex items-center justify-center transition-all shadow-sm hover:shadow-md"><FaChevronRight className="text-sm sm:text-base" /></button>
                                    </div>
                                )}
                            </main>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProductsPage;
