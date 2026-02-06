import { Pagination } from '../../../shared/types';

export interface CategoryInfo {
    id: string;
    slug: string;
    name?: string;
}

export interface Ingredient {
    id?: string;
    ingredientId?: string;
    name?: string;
    shortDescription?: string;
}

export interface ProductVariant {
    id: string;
    sku: string;
    unitType: string;
    specification?: string;
    salePrice: number;
    discountPercent?: number;
    isDefault: boolean;
    isActive: boolean;
    quantityAvailable: number;
    quantityOnHand: number;
}

export interface Product {
    id: string;
    code: string;
    slug: string;
    name: string;
    webName: string;
    primaryImage: string;
    variants: ProductVariant[];
    quantityAvailable: number;
    categories: CategoryInfo[];
    averageRating: number;
    totalReviews: number;
    isActive?: boolean;
}

export interface ProductDetail {
    id: string;
    code: string;
    slug: string;
    name: string;
    webName: string;
    primaryImage: string;
    secondaryImages: string[];
    brand: string;
    brandOrigin: string;
    producer: string;
    description: string;
    specification?: string;
    careful?: string;
    adverseEffect?: string;
    preservation?: string;
    variants: ProductVariant[];
    ingredient: Ingredient[];
    usage: string;
    dosage: string;
    categories: CategoryInfo[];
    quantityAvailable: number;
    quantityOnHand: number;
    averageRating: number;
    totalReviews: number;
    isActive?: boolean;
}

export interface ProductPageList {
    products: Product[];
    pagination?: Pagination;
}
