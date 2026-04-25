import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import type { Product, ProductVariant } from "../types/domain";
import type { CartDetails } from "@/features/cart/types/domain";
import { getPreferredVariant, type ProductSortBy } from "../services/product.service";
import { getDisplayVariantStock, getEffectiveVariantPrice, getLiveFlashSale, isVariantPurchasable } from "../product.utils";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { useUpdateCartItem } from "@/features/cart/hooks/useUpdateCartItem";
import { useEventTracking } from "@/features/shared/hooks/useEventTracking";
import { EventType } from "@/features/shared/types/event";
import { flashSaleApi } from "@/features/flash-sale/api/flashSale.api";

export const useProductCardActions = (product: Product, sortBy?: ProductSortBy) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, openAuthModal } = useAuthContext();
    const addToCartMutation = useAddToCart();
    const updateCartItemMutation = useUpdateCartItem();
    const { track } = useEventTracking();

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(() =>
        getPreferredVariant(product.variants, sortBy)
    );
    const [quantity, setQuantity] = useState(1);

    const activeVariants = useMemo(
        () => product.variants.filter((variant) => variant.isActive),
        [product.variants]
    );

    const isOutOfStock = !selectedVariant || !isVariantPurchasable(selectedVariant);
    const maxQuantity = selectedVariant ? (getDisplayVariantStock(selectedVariant) ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
    const canDecreaseQuantity = quantity > 1;
    const canIncreaseQuantity = quantity < maxQuantity;
    const canPurchase = Boolean(selectedVariant) && !isOutOfStock && !addToCartMutation.isPending;
    const liveFlashSale = getLiveFlashSale(selectedVariant);

    useEffect(() => {
        setSelectedVariant(getPreferredVariant(product.variants, sortBy));
        setQuantity(1);
    }, [product.variants, sortBy, product.id]);

    const findExistingCartItemId = (variantId: string) => {
        const cachedQueries = queryClient.getQueriesData<unknown>({ queryKey: ["cart"] });

        for (const [, data] of cachedQueries) {
            const pages = (data as { pages?: CartDetails[] } | undefined)?.pages;
            if (!pages) continue;

            for (const page of pages) {
                const match = page.items.find((item) => item.variantId === variantId);
                if (match) {
                    return match;
                }
            }
        }

        return null;
    };

    const notifyAdded = () => {
        toast.success(`Đã thêm ${product.webName || product.name} vào giỏ`, {
            duration: 2000,
            style: {
                borderRadius: "16px",
                background: "#10B981",
                color: "#fff",
                fontWeight: "bold",
            },
        });
    };

    const selectVariant = (variant: ProductVariant) => {
        setSelectedVariant(variant);
        setQuantity(1);
    };

    const decreaseQuantity = () => {
        setQuantity((current) => Math.max(1, current - 1));
    };

    const increaseQuantity = () => {
        setQuantity((current) => Math.min(maxQuantity, current + 1));
    };

    const handleAddToCart = () => {
        if (!product || !selectedVariant || !canPurchase) return;
        if (!user) {
            openAuthModal();
            return;
        }

        const existingItem = findExistingCartItemId(selectedVariant.id);
        const availableQuantity = selectedVariant.availableQuantity ?? null;

        if (existingItem) {
            const nextQuantity = availableQuantity == null
                ? existingItem.quantity + quantity
                : Math.min(existingItem.quantity + quantity, availableQuantity);

            if (nextQuantity === existingItem.quantity) {
                toast.error("Số lượng trong giỏ đã đạt mức tối đa");
                return;
            }

            updateCartItemMutation.mutate(
                { itemId: existingItem.id, quantity: nextQuantity },
                {
                    onSuccess: () => {
                        void track(EventType.ADD_TO_CART, product.id, {
                            variantId: selectedVariant.id,
                            quantity,
                            price: getEffectiveVariantPrice(selectedVariant),
                            action: "increment_existing_cart_item",
                        });
                        notifyAdded();
                    },
                    onError: (err: unknown) => {
                        const message = err instanceof Error ? err.message : "Lỗi khi thêm vào giỏ";
                        toast.error(message);
                    },
                }
            );
            return;
        }

        addToCartMutation.mutate(
            { variantId: selectedVariant.id, quantity },
            {
                onSuccess: () => {
                    void track(EventType.ADD_TO_CART, product.id, {
                        variantId: selectedVariant.id,
                        quantity,
                        price: getEffectiveVariantPrice(selectedVariant),
                        action: "add_new_cart_item",
                    });
                    notifyAdded();
                },
                onError: (err: unknown) => {
                    const message = err instanceof Error ? err.message : "Lỗi khi thêm vào giỏ";
                    toast.error(message);
                },
            }
        );
    };

    const handleBuyNow = async () => {
        if (!product || !selectedVariant || !canPurchase) return;
        if (!user) {
            openAuthModal();
            return;
        }

        void track(EventType.CHECKOUT, product.id, {
            variantId: selectedVariant.id,
            quantity,
            price: getEffectiveVariantPrice(selectedVariant),
        });

        if (liveFlashSale?.id) {
            try {
                const reservation = await flashSaleApi.claim(liveFlashSale.id, {
                    quantity,
                    idempotencyKey: crypto.randomUUID(),
                });
                navigate(`/checkout?mode=BUY_NOW&variantId=${selectedVariant.id}&quantity=${quantity}&flashSaleReservationId=${reservation.reservationId}`);
                return;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Không thể giữ chỗ flash sale";
                toast.error(message);
                return;
            }
        }

        navigate(`/checkout?mode=BUY_NOW&variantId=${selectedVariant.id}&quantity=${quantity}`);
    };

    return {
        activeVariants,
        selectedVariant,
        quantity,
        canDecreaseQuantity,
        canIncreaseQuantity,
        canPurchase,
        isOutOfStock,
        selectVariant,
        decreaseQuantity,
        increaseQuantity,
        handleAddToCart,
        handleBuyNow,
        isProcessing: addToCartMutation.isPending || updateCartItemMutation.isPending,
    };
};
