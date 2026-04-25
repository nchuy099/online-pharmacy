import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import { useProductDetails } from "../hooks/useProductDetails";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { ProductBreadcrumb } from "../components/ProductBreadcrumb";
import { ProductImageGallery } from "../components/ProductImageGallery";
import { ProductBriefInfo } from "../components/ProductBriefInfo";
import { ProductPurchaseActions } from "../components/ProductPurchaseActions";
import { ProductDetailedInfo } from "../components/ProductDetailedInfo";
import { ProductCard } from "../components/ProductCard";
import { ReviewList } from "@/features/review/components/ReviewList";
import { toast } from "react-hot-toast";
import { useEventTracking } from "@/features/shared/hooks/useEventTracking";
import { EventType } from "@/features/shared/types/event";
import { useRecommendedProducts } from "@/features/recommendation/hooks/useRecommendedProducts";
import { flashSaleApi } from "@/features/flash-sale/api/flashSale.api";
import { useFlashSaleStock } from "@/features/flash-sale/hooks/useFlashSaleStock";
import { getLiveFlashSale } from "../product.utils";

const ProductDetailsPage: React.FC = () => {
    const { "*": slug } = useParams<{ "*": string }>();
    const navigate = useNavigate();
    const { product, loading, error, selectedVariant, selectVariant } = useProductDetails(slug, "slug");
    const addToCartMutation = useAddToCart();
    const { user, openAuthModal } = useAuthContext();

    const { track } = useEventTracking();
    const {
        products: relatedProducts,
        loading: loadingRelatedProducts,
    } = useRecommendedProducts(
        {
            currentItemId: product?.id,
            topK: 8,
        },
        {
            enabled: Boolean(product?.id),
        }
    );

    const [quantity, setQuantity] = React.useState(1);
    const [activeImage, setActiveImage] = React.useState<string | null>(null);
    const liveFlashSale = getLiveFlashSale(selectedVariant);
    const { remainingStock: liveFlashSaleRemainingStock } = useFlashSaleStock(liveFlashSale?.id);

    React.useEffect(() => {
        if (product) {
            setActiveImage(product.primaryImage || null);
            track(EventType.CLICK, product.id);
        }
    }, [product, track]);

    React.useEffect(() => {
        setQuantity(1);
    }, [selectedVariant]);

    const handleAddToCart = () => {
        if (!product || !selectedVariant) return;
        if (!user) {
            openAuthModal();
            return;
        }
        addToCartMutation.mutate({ variantId: selectedVariant.id, quantity }, {
            onSuccess: () => {
                track(EventType.ADD_TO_CART, product.id, {
                    variantId: selectedVariant.id,
                    quantity,
                    price: selectedVariant.salePrice,
                });

                toast.success(`Đã thêm ${product.webName || product.name} vào giỏ`, {
                    duration: 2000,
                    style: {
                        borderRadius: "16px",
                        background: "#10B981",
                        color: "#fff",
                        fontWeight: "bold",
                    },
                });
            },
            onError: (err: unknown) => {
                const message = err instanceof Error ? err.message : "Lỗi khi thêm vào giỏ";
                toast.error(message);
            },
        });
    };

    const handleBuyNow = async () => {
        if (!product || !selectedVariant) return;
        if (!user) {
            openAuthModal();
            return;
        }

        track(EventType.CHECKOUT, product.id, {
            variantId: selectedVariant.id,
            quantity,
            price: liveFlashSale?.flashPrice ?? selectedVariant.salePrice,
        });

        if (liveFlashSale?.id) {
            try {
                const reservation = await flashSaleApi.claim(liveFlashSale.id, {
                    quantity,
                    idempotencyKey: crypto.randomUUID(),
                });
                navigate(`/checkout?mode=BUY_NOW&variantId=${selectedVariant.id}&quantity=${quantity}&flashSaleReservationId=${reservation.reservationId}`);
                return;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Không thể giữ chỗ flash sale";
                toast.error(message);
                return;
            }
        }

        navigate(`/checkout?mode=BUY_NOW&variantId=${selectedVariant.id}&quantity=${quantity}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f0f3f8] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Đang tải thông tin sản phẩm...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#f0f3f8] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-md w-full">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <FaExclamationTriangle className="text-3xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-gray-500 mb-8">{error || "Không tìm thấy thông tin sản phẩm."}</p>
                    <button
                        onClick={() => navigate("/")}
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all"
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f3f8]">
            <div className="bg-white border-b border-gray-200">
                <ProductBreadcrumb categories={product.categories} />

                <div className="max-w-7xl mx-auto px-6 pb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <ProductImageGallery
                            primaryImage={product.primaryImage || ""}
                            secondaryImages={product.secondaryImages}
                            productName={product.webName || product.name}
                            activeImage={activeImage}
                            onImageSelect={setActiveImage}
                        />

                        <div className="lg:col-span-6 flex flex-col justify-center">
                            <ProductBriefInfo
                                brand={product.brand}
                                brandOrigin={product.brandOrigin}
                                producer={product.producer}
                                productName={product.webName || product.name}
                                averageRating={product.averageRating}
                                totalReviews={product.totalReviews}
                            />

                            <ProductPurchaseActions
                                variants={product.variants}
                                selectedVariant={selectedVariant}
                                onVariantSelect={selectVariant}
                                quantity={quantity}
                                onQuantityChange={setQuantity}
                                onAddToCart={handleAddToCart}
                                onBuyNow={handleBuyNow}
                                isProcessing={addToCartMutation.isPending}
                                liveFlashSaleRemainingStock={liveFlashSaleRemainingStock}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <ProductDetailedInfo
                    description={product.description}
                    ingredients={product.ingredients}
                    usage={product.usage}
                    dosage={product.dosage}
                    adverseEffect={product.adverseEffect}
                    careful={product.careful}
                    preservation={product.preservation}
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-8">
                <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-black text-[#001737] uppercase tracking-tight">
                        Sản phẩm liên quan
                    </h2>
                    <p className="text-gray-400 font-bold text-sm mt-1">
                        Gợi ý dựa trên sản phẩm bạn đang xem và hành vi người dùng tương tự
                    </p>
                </div>

                {loadingRelatedProducts ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-[320px] bg-gray-50 animate-pulse rounded-3xl"></div>
                        ))}
                    </div>
                ) : relatedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {relatedProducts.slice(0, 8).map((relatedProduct) => (
                            <ProductCard key={relatedProduct.id} product={relatedProduct} />
                        ))}
                    </div>
                ) : null}
            </div>

            <div id="product-reviews" className="max-w-7xl mx-auto px-6 pb-12">
                <ReviewList productId={product.id} />
            </div>
        </div>
    );
};

export default ProductDetailsPage;
