import { useNavigate } from "react-router-dom";
import { Product } from "../types/domain";
import { PageHeader } from "../../../shared/components";
import { useProductList } from "../hooks/useProduct";
import { useCategoryAll } from "../../category/hooks/useCategory";
import { ProductTable, ProductFilters } from "../components";
import { Pagination } from "../../../shared/components/ui";

const ProductPage = () => {
    const navigate = useNavigate();
    const {
        products,
        isLoading,
        pagination,
        search,
        setSearch,
        categorySlug,
        setCategorySlug,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
        setPage
    } = useProductList();


    const { categories: allCategories } = useCategoryAll();

    const openCreatePage = () => {
        navigate("/products/new");
    };

    const handleView = (product: Product) => {
        navigate(`/products/${product.id}/details`);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };


    return (
        <div className="space-y-6">
            <PageHeader
                title="Quản lý sản phẩm"
                description="Thêm, sửa, xóa sản phẩm thuốc"
                actionLabel="Thêm sản phẩm"
                onAction={openCreatePage}
            />

            <ProductFilters
                search={search}
                onSearchChange={setSearch}
                categorySlug={categorySlug}
                onCategoryChange={setCategorySlug}
                minPrice={minPrice}
                onMinPriceChange={setMinPrice}
                maxPrice={maxPrice}
                onMaxPriceChange={setMaxPrice}
            />

            <div className="space-y-4">
                <ProductTable products={products} onView={handleView} categories={allCategories} isLoading={isLoading} />

                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalElements={pagination.totalElements}
                    pageSize={pagination.size}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
};

export default ProductPage;
