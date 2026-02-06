import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductDetails } from '../hooks/useProduct';
import { useProductActions } from '../hooks/useProduct';
import ProductDetailsHeader from '../components/ProductDetailsHeader';
import ProductBasicInfoCard from '../components/ProductBasicInfoCard';
import ProductVariantsSection from '../components/ProductVariantsSection';
import ProductCategoryEditDialog from '../components/ProductCategoryEditDialog';
import { ConfirmDialog } from '../../../shared/components';
import { notificationBus } from '../../notification';
import productApi from '../api';
import { UpdateProductRequestDto } from '../types/dto';

const ProductDetailsPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { product, isLoading, error, refetch } = useProductDetails(productId);
    const { removeProduct, updateProduct, isLoading: isMutating } = useProductActions();
    const [unitTypeOptions, setUnitTypeOptions] = useState<string[]>([]);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

    React.useEffect(() => {
        let mounted = true;
        const loadCatalog = async () => {
            try {
                const res = await productApi.getCatalogOptions();
                const data = (res as any)?.data ?? (res as any);
                const options = (data?.unitTypes || []).map((item: any) => item.name).filter(Boolean);
                if (mounted) setUnitTypeOptions(options);
            } catch {
                if (mounted) setUnitTypeOptions([]);
            }
        };
        void loadCatalog();
        return () => {
            mounted = false;
        };
    }, []);

    const handleDeleteClick = () => {
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await removeProduct(productId);
            notificationBus.success('Xóa sản phẩm thành công');
            navigate('/products');
        } catch (err) {
            console.error('Delete failed:', err);
            notificationBus.error('Xóa sản phẩm thất bại');
            setIsDeleteOpen(false);
        }
    };

    const handleSaveSection = async (section: 'basic' | 'images' | 'content' | 'ingredients', payload: Partial<UpdateProductRequestDto>) => {
        if (!productId) return;
        try {
            await updateProduct(productId, payload);
            await refetch();
            const labelMap: Record<typeof section, string> = {
                basic: 'thông tin cơ bản',
                images: 'hình ảnh',
                content: 'nội dung chi tiết',
                ingredients: 'thành phần',
            };
            notificationBus.success(`Cập nhật ${labelMap[section]} thành công`);
        } catch (error: any) {
            notificationBus.error(error?.message || 'Cập nhật sản phẩm thất bại');
            throw error;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-50 border-t-emerald-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 animate-pulse" />
                    </div>
                </div>
                <p className="mt-6 text-slate-500 font-bold animate-pulse">Đang tải thông tin sản phẩm...</p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600 mb-6 shadow-lg shadow-rose-100 animate-bounce-subtle">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Đã xảy ra lỗi</h2>
                <p className="text-slate-500 max-w-md font-medium">{error?.message || 'Không thể tải thông tin sản phẩm. Vui lòng kiểm tra lại kết nối hoặc thử lại sau.'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ProductDetailsHeader onDelete={handleDeleteClick} isDeleting={isMutating} />

            <div className="space-y-5">
                <section>
                    <ProductBasicInfoCard
                        product={product}
                        onSaveSection={handleSaveSection}
                        onOpenCategoryEditor={() => setIsCategoryDialogOpen(true)}
                    />
                </section>

                <section>
                    <ProductVariantsSection
                        productId={product.id!}
                        variants={product.variants || []}
                        unitTypeOptions={unitTypeOptions}
                        onChanged={refetch}
                    />
                </section>
            </div>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                title="Xác nhận xóa sản phẩm"
                message={`Bạn có chắc chắn muốn xóa "${product.webName || product.name}" không?`}
                confirmLabel="Xác nhận xóa"
                cancelLabel="Hủy bỏ"
                isDangerous={true}
                onCancel={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
            />

            <ProductCategoryEditDialog
                productId={product.id}
                initialCategoryIds={(product.categories || []).map((item) => item.id)}
                isOpen={isCategoryDialogOpen}
                onClose={() => setIsCategoryDialogOpen(false)}
                onSaved={() => {
                    void refetch();
                }}
            />
        </div>
    );
};

export default ProductDetailsPage;
