import productApi from '../api';
import { Product, ProductDetail, ProductVariant } from '../types/domain';
import {
    ProductListResponseDto,
    ProductDetailsResponseDto,
    CreateProductRequestDto,
    UpdateProductRequestDto,
    ProductListVariantResponseDto,
    ProductDetailsVariantResponseDto,
    ProductImageUploadUrlRespDto,
    CreateProductVariantRequestDto,
    UpdateProductVariantRequestDto,
    UpdateProductCategoriesRequestDto,
} from '../types/dto';
import { Pagination } from '../../../shared/types/pagination';

const resolveUnitType = (v: { unitType?: string; unit?: string }): string => {
    return v.unitType || v.unit || "";
};

const mapVariantList = (v: ProductListVariantResponseDto): ProductVariant => ({
    id: v.id,
    sku: v.sku,
    unitType: resolveUnitType(v),
    specification: v.specification,
    salePrice: v.salePrice,
    discountPercent: v.discountPercent,
    isDefault: v.isDefault,
    quantityAvailable: v.quantityAvailable,
    isActive: v.isActive ?? true,
    quantityOnHand: 0,
});

const mapVariantDetails = (v: ProductDetailsVariantResponseDto): ProductVariant => ({
    id: v.id,
    sku: v.sku,
    unitType: resolveUnitType(v),
    specification: v.specification,
    salePrice: v.salePrice,
    discountPercent: v.discountPercent,
    isDefault: v.isDefault,
    isActive: v.isActive,
    quantityAvailable: v.quantityAvailable,
    quantityOnHand: v.quantityOnHand,
});

const pickDefaultVariant = (variants: ProductVariant[]): ProductVariant | undefined => {
    return variants.find(v => v.isDefault) || variants[0];
};

const mapApiProduct = (item: ProductListResponseDto): Product => {
    return {
        id: item.id,
        code: item.code || item.id,
        slug: item.slug,
        name: item.name,
        webName: item.webName,
        primaryImage: item.primaryImage,
        categories: item.categories || [],
        quantityAvailable: item.quantityAvailable,
        averageRating: item.averageRating || 0,
        totalReviews: item.totalReviews || 0,
        isActive: true,
        variants: (item.variants || []).map(mapVariantList),
    };
};

const mapApiProductDetails = (item: ProductDetailsResponseDto): ProductDetail => {
    const variants = (item.variants || []).map(mapVariantDetails);
    const defaultVariant = pickDefaultVariant(variants);

    return {
        id: item.id,
        code: item.code || item.id,
        slug: item.slug,
        name: item.name,
        webName: item.webName,
        primaryImage: item.primaryImage,
        secondaryImages: item.secondaryImages || [],
        brand: item.brand,
        brandOrigin: item.brandOrigin,
        producer: item.producer,
        description: item.description || "",
        specification: defaultVariant?.specification,
        careful: item.careful || "",
        adverseEffect: item.adverseEffect,
        preservation: item.preservation,
        usage: item.usage,
        dosage: item.dosage,
        categories: item.categories || [],
        ingredient: item.ingredient || [],
        quantityAvailable: item.quantityAvailable || 0,
        quantityOnHand: item.quantityOnHand || 0,
        averageRating: item.averageRating || 0,
        totalReviews: item.totalReviews || 0,
        isActive: item.isActive,
        variants,
    };
};

const resolveUploadPayload = (res: any): ProductImageUploadUrlRespDto => {
    const payload = res?.data?.data ?? res?.data ?? res?.result ?? res;
    if (!payload?.uploadUrl || !payload?.fileUrl) {
        throw new Error('Create upload URL failed');
    }
    return payload as ProductImageUploadUrlRespDto;
};

const mapVariantResponse = (variant: ProductDetailsVariantResponseDto): ProductVariant => {
    return mapVariantDetails(variant);
};

const uploadFileToS3 = async (uploadUrl: string, file: File) => {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
        },
        body: file,
    });

    if (!response.ok) {
        const responseText = await response.text().catch(() => '');
        console.error('[S3 Upload][Product] Forbidden/Failed response', {
            status: response.status,
            statusText: response.statusText,
            uploadUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            responseText,
        });

        throw new Error('Upload file to S3 failed (' + response.status + ' ' + response.statusText + ')');
    }
};

const productService = {
    async getList(page?: number, size?: number, search?: string, categorySlug?: string, minPrice?: number, maxPrice?: number): Promise<{ products: Product[]; pagination: Pagination }> {
        const res = await productApi.getList(page ?? 1, size ?? 10, search, categorySlug, minPrice, maxPrice);
        const data = res.data as any;
        const productsRaw = data?.products ?? data?.result?.products ?? [];
        const pagination = data?.pagination ?? data?.result?.pagination ?? {
            page: 1,
            size: 10,
            totalPages: 0,
            totalElements: 0,
        };
        return {
            products: Array.isArray(productsRaw) ? productsRaw.map(mapApiProduct) : [],
            pagination,
        };
    },

    async uploadProductImage(file: File): Promise<string> {
        const res = await productApi.createImageUploadUrl();
        const payload = resolveUploadPayload(res);
        await uploadFileToS3(payload.uploadUrl, file);
        return payload.fileUrl;
    },

    async create(payload: CreateProductRequestDto): Promise<ProductDetail> {
        const res = await productApi.create(payload);
        const productDto = (res.data as any)?.product ?? (res.data as any) ?? (res as any).result;
        if (!productDto) throw new Error(res.message || 'Create product failed');
        return mapApiProductDetails(productDto as ProductDetailsResponseDto);
    },

    async update(id: string, payload: UpdateProductRequestDto): Promise<ProductDetail> {
        const res = await productApi.update(id, payload);
        const productDto = (res.data as any)?.product ?? (res.data as any) ?? (res as any).result;
        if (!productDto) throw new Error(res.message || 'Update product failed');
        return mapApiProductDetails(productDto as ProductDetailsResponseDto);
    },

    async updateCategories(id: string, payload: UpdateProductCategoriesRequestDto): Promise<ProductDetail> {
        const res = await productApi.updateCategories(id, payload);
        const productDto = (res.data as any)?.product ?? (res.data as any) ?? (res as any).result;
        if (!productDto) throw new Error(res.message || 'Update product categories failed');
        return mapApiProductDetails(productDto as ProductDetailsResponseDto);
    },

    async remove(productId: string | undefined): Promise<void> {
        await productApi.remove(productId);
    },

    async getDetails(productId: string | undefined): Promise<ProductDetail> {
        const res = await productApi.getDetails(productId);
        const productDetailsDto = (res.data as any)?.data ?? (res.data as any) ?? (res as any).result;
        if (!productDetailsDto) throw new Error(res.message || 'Get product details failed');
        return mapApiProductDetails(productDetailsDto as ProductDetailsResponseDto);
    },

    async getVariants(productId: string): Promise<ProductVariant[]> {
        const res = await productApi.getVariants(productId);
        const variants = (res.data as any)?.data ?? (res.data as any) ?? (res as any).result ?? [];
        return Array.isArray(variants) ? variants.map(mapVariantResponse) : [];
    },

    async createVariant(productId: string, payload: CreateProductVariantRequestDto): Promise<ProductVariant> {
        const res = await productApi.createVariant(productId, payload);
        const variant = (res.data as any)?.data ?? (res.data as any) ?? (res as any).result;
        if (!variant) throw new Error(res.message || 'Create product variant failed');
        return mapVariantResponse(variant as ProductDetailsVariantResponseDto);
    },

    async updateVariant(productId: string, variantId: string, payload: UpdateProductVariantRequestDto): Promise<ProductVariant> {
        const res = await productApi.updateVariant(productId, variantId, payload);
        const variant = (res.data as any)?.data ?? (res.data as any) ?? (res as any).result;
        if (!variant) throw new Error(res.message || 'Update product variant failed');
        return mapVariantResponse(variant as ProductDetailsVariantResponseDto);
    },

    async deleteVariant(productId: string, variantId: string): Promise<void> {
        await productApi.deleteVariant(productId, variantId);
    },
};

export default productService;
