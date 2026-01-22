import { useState, useEffect, useCallback } from "react";
import type { Product, ProductVariant } from "../types/domain";
import { productService, getDefaultVariant } from "../services/product.service";

export const useProductDetails = (identifier: string | undefined, type: 'id' | 'slug' | 'sku' = 'slug') => {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    const fetchDetails = async () => {
        if (!identifier) return;
        try {
            setLoading(true);
            setError(null);
            let data: Product;
            if (type === 'slug') {
                data = await productService.getProductBySlug(identifier);
            } else if (type === 'sku') {
                data = await productService.getProductBySku(identifier);
            } else {
                data = await productService.getProductById(identifier);
            }
            setProduct(data);

            // Auto-select default variant
            const defaultV = getDefaultVariant(data.variants);
            setSelectedVariant(defaultV);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [identifier, type]);

    const selectVariant = useCallback((variant: ProductVariant) => {
        setSelectedVariant(variant);
    }, []);

    return {
        product,
        loading,
        error,
        selectedVariant,
        selectVariant,
        refreshDetails: fetchDetails,
    };
};