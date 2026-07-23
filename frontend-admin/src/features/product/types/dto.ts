import { Pagination } from '../../../shared/types';

export interface CategoryInfoDto {
    id: string;
    slug: string;
    name?: string;
}

export interface ProductIngredientDto {
    id?: string;
    ingredientId?: string;
    name?: string;
    shortDescription?: string;
}

export interface VariantRequestDto {
    id?: string;
    sku?: string;
    unitType: string;
    unit?: string;
    specification?: string;
    salePrice: number;
    discountPercent?: number;
    isDefault?: boolean;
    isActive?: boolean;
}

export interface ProductImageUploadUrlRespDto {
    uploadUrl: string;
    fileUrl: string;
}

export interface CreateProductRequestDto {
    name: string;
    webName?: string;
    slug?: string;
    primaryImage?: string;
    secondaryImages?: string[];
    brand?: string;
    brandOrigin?: string;
    producer?: string;
    description?: string;
    careful?: string;
    adverseEffect?: string;
    preservation?: string;
    usage?: string;
    dosage?: string;
    categoryIds: string[];
    variants?: VariantRequestDto[];
    ingredient?: ProductIngredientDto[];
}

export interface UpdateProductRequestDto extends Partial<Omit<CreateProductRequestDto, 'categoryIds'>> {
    categoryIds?: string[];
}

export interface UpdateProductCategoriesRequestDto {
    categoryIds: string[];
}

export interface CreateProductVariantRequestDto {
    sku?: string;
    unitType: string;
    unit?: string;
    specification?: string;
    salePrice: number;
    discountPercent?: number;
    isDefault?: boolean;
    isActive?: boolean;
}

export interface UpdateProductVariantRequestDto {
    sku?: string;
    unitType?: string;
    unit?: string;
    specification?: string;
    salePrice?: number;
    discountPercent?: number;
    isDefault?: boolean;
    isActive?: boolean;
}

export interface ProductListVariantResponseDto {
    id: string;
    sku: string;
    unitType?: string;
    specification?: string;
    salePrice: number;
    discountPercent: number;
    isDefault: boolean;
    isActive?: boolean;
    quantityAvailable: number;
}

export interface ProductListResponseDto {
    id: string;
    code?: string;
    slug: string;
    name: string;
    webName: string;
    primaryImage: string;
    variants: ProductListVariantResponseDto[];
    quantityAvailable: number;
    categories: CategoryInfoDto[];
    averageRating: number;
    totalReviews: number;
}

export interface ProductDetailsVariantResponseDto {
    id: string;
    sku: string;
    unitType?: string;
    specification?: string;
    salePrice: number;
    discountPercent: number;
    isDefault: boolean;
    isActive: boolean;
    quantityAvailable: number;
    quantityOnHand: number;
}

export interface ProductDetailsResponseDto {
    id: string;
    code?: string;
    slug: string;
    name: string;
    webName: string;
    primaryImage: string;
    secondaryImages: string[];
    brand: string;
    brandOrigin: string;
    producer: string;
    description?: string;
    careful?: string;
    adverseEffect?: string;
    preservation?: string;
    variants: ProductDetailsVariantResponseDto[];
    isActive?: boolean;
    ingredient: ProductIngredientDto[];
    usage: string;
    dosage: string;
    categories: CategoryInfoDto[];
    quantityAvailable: number;
    quantityOnHand: number;
    averageRating: number;
    totalReviews: number;
}

export interface ProductPageResponseDto {
    products: ProductListResponseDto[];
    pagination?: Pagination;
}

export interface CatalogOptionDto {
    id: string;
    type: "BRAND" | "BRAND_ORIGIN" | "INGREDIENT" | "UNIT_TYPE";
    code: string;
    name: string;
    parentId?: string | null;
    parentCode?: string | null;
    parentName?: string | null;
}

export interface ProductCatalogOptionsDto {
    brands: CatalogOptionDto[];
    brandOrigins: CatalogOptionDto[];
    ingredients: CatalogOptionDto[];
    unitTypes: CatalogOptionDto[];
}
