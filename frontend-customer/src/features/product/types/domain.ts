import type { Pagination } from "@/features/shared/api/types/api";

export interface ProductVariant {
    id: string;
    sku: string;
    unitType: string;
    specification?: string | null;
    salePrice: number;
    discountPercent?: number | null;
    availableQuantity?: number | null;
    isDefault: boolean;
    isActive: boolean;
    flashSale?: FlashSaleSummary | null;
}

export interface FlashSaleSummary {
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

export interface ProductImage {
    id?: string;
    url: string;
    sortOrder?: number;
}

export interface Ingredient {
    ingredientId: string | number;
    name: string;
    shortDescription: string;
}

export interface CategorySummary {
    id: string;
    slug: string;
    name: string;
}

export interface Product {
    id: string;
    code?: string | null;
    slug: string;
    name: string;
    webName?: string | null;
    brand?: string | null;
    brandOrigin?: string | null;
    producer?: string | null;
    description?: string | null;
    careful?: string | null;
    adverseEffect?: string | null;
    preservation?: string | null;
    usage?: string | null;
    dosage?: string | null;
    primaryImage?: string | null;
    secondaryImages: string[];
    images: ProductImage[];
    ingredients: Ingredient[];
    categories: CategorySummary[];
    variants: ProductVariant[];
    defaultVariantId?: string | null;
    averageRating: number;
    totalReviews: number;
}

export interface Category {
    id: string;
    slug: string;
    name: string;
    parentName?: string;
    level: number;
    isActive: boolean;
    productCount: number;
    children?: Category[];
}

export interface ProductListResponse {
    pagination: Pagination;
    products: Product[];
}
