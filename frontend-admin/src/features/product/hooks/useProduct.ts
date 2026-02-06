import { useCallback, useEffect, useState } from 'react';
import productService from '../services';
import { Product, ProductDetail } from '../types/domain';
import {
    CreateProductRequestDto,
    UpdateProductRequestDto,
    UpdateProductCategoriesRequestDto,
    CreateProductVariantRequestDto,
    UpdateProductVariantRequestDto,
} from '../types/dto';

import { Pagination } from '../../../shared/types/pagination';

export const useProductList = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [search, setSearch] = useState<string>('');
    const [categorySlug, setCategorySlug] = useState<string>('');
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0,
    });

    const refresh = useCallback(async (page: number = 1, size: number = 10, searchParam?: string, categorySlugParam?: string, minPriceParam?: number, maxPriceParam?: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await productService.getList(page, size, searchParam, categorySlugParam, minPriceParam, maxPriceParam);
            setProducts(response.products);
            setPagination(response.pagination);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSetSearch = (val: string) => {
        setSearch(val);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSetCategorySlug = (val: string) => {
        setCategorySlug(val);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSetMinPrice = (val: number | undefined) => {
        setMinPrice(val);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSetMaxPrice = (val: number | undefined) => {
        setMaxPrice(val);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSetPage = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
    };

    useEffect(() => {
        refresh(pagination.page, pagination.size, search, categorySlug, minPrice, maxPrice);
    }, [refresh, search, categorySlug, minPrice, maxPrice, pagination.page, pagination.size]);

    return {
        products, isLoading, error, refresh, setProducts,
        pagination, search, setSearch: handleSetSearch, categorySlug, setCategorySlug: handleSetCategorySlug,
        minPrice, setMinPrice: handleSetMinPrice, maxPrice, setMaxPrice: handleSetMaxPrice,
        setPage: handleSetPage
    };
};


export const useProductActions = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const createProduct = useCallback(async (payload: CreateProductRequestDto) => {
        setIsLoading(true);
        setError(null);
        try {
            return await productService.create(payload);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateProduct = useCallback(async (id: string, payload: UpdateProductRequestDto) => {
        setIsLoading(true);
        setError(null);
        try {
            return await productService.update(id, payload);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const removeProduct = useCallback(async (productId: string | undefined) => {
        setIsLoading(true);
        setError(null);
        try {
            await productService.remove(productId);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateProductCategories = useCallback(async (id: string, payload: UpdateProductCategoriesRequestDto) => {
        setIsLoading(true);
        setError(null);
        try {
            return await productService.updateCategories(id, payload);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { createProduct, updateProduct, updateProductCategories, removeProduct, isLoading, error };
};

export const useProductDetails = (productId?: string) => {
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchDetails = useCallback(async () => {
        if (!productId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const details = await productService.getDetails(productId);
            setProduct(details);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    return { product, isLoading, error, refetch: fetchDetails };
};

export const useProductVariantActions = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const createVariant = useCallback(async (productId: string, payload: CreateProductVariantRequestDto) => {
        setIsLoading(true);
        setError(null);
        try {
            return await productService.createVariant(productId, payload);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateVariant = useCallback(async (productId: string, variantId: string, payload: UpdateProductVariantRequestDto) => {
        setIsLoading(true);
        setError(null);
        try {
            return await productService.updateVariant(productId, variantId, payload);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteVariant = useCallback(async (productId: string, variantId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await productService.deleteVariant(productId, variantId);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { createVariant, updateVariant, deleteVariant, isLoading, error };
};
