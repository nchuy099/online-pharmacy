import type { Pagination } from "@/features/shared/api/types/api";

export interface ProductImageDTO {
    id?: string;
    url: string;
    sortOrder?: number;
}

export interface IngredientDTO {
    ingredientId: string | number;
    name: string;
    shortDescription: string;
}

export interface CategorySummaryDTO {
    id: string;
    slug: string;
    name: string;
}

export interface ProductVariantDTO {
    id: string;
    sku: string;
    unitType?: string;
    specification?: string | null;
    salePrice: number;
    discountPercent?: number | null;
    availableQuantity?: number | null;
    quantityAvailable?: number | null;
    isDefault: boolean;
    isActive: boolean;
    flashSale?: FlashSaleSummaryDTO | null;

    // Legacy fallback fields
    unit?: string;
    variantName?: string;
}

export interface FlashSaleSummaryDTO {
    id: string;
    campaignId?: string | null;
    campaignName?: string | null;
    flashPrice: number;
    originalPrice?: number | null;
    remainingStock: number;
    saleStock?: number | null;
    perUserLimit?: number | null;
    startAt?: string | null;
    endAt?: string | null;
    status?: string | null;
}

export interface ProductDTO {
    id: string;
    code?: string | null;
    slug: string;
    name: string;
    webName?: string | null;
    brand?: string | null;
    brandOrigin?: string | null;
    producer?: string | null;
    description?: string | null;
    careful?: string | string[] | null;
    adverseEffect?: string | null;
    preservation?: string | null;
    usage?: string | null;
    dosage?: string | null;
    primaryImage?: string | null;
    secondaryImages?: string[];
    images?: ProductImageDTO[];
    ingredients?: IngredientDTO[];
    ingredient?: IngredientDTO[];
    categories?: CategorySummaryDTO[];
    variants?: ProductVariantDTO[];
    defaultVariantId?: string | null;
    averageRating?: number;
    totalReviews?: number;

    // Legacy fields for backward compatibility during migration
    sku?: string;
    prices?: LegacyPriceDTO[];
    quantityAvailable?: number;
}

/** @deprecated Legacy price DTO - will be removed after full migration */
export interface LegacyPriceDTO {
    measureUnitCode: number;
    measureUnitName: string;
    price: number;
    currencySymbol: string;
    productSpecs: string;
}

export interface ProductListResponseDTO {
    pagination: Pagination;
    products: ProductDTO[];
}

export interface CategoryDTO {
    id: string;
    slug: string;
    name: string;
    parentName?: string;
    level: number;
    isActive: boolean;
    productCount: number;
    children?: CategoryDTO[];
}
