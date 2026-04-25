import { productApi } from "../api/product.api";
import type { ProductDTO, ProductVariantDTO, IngredientDTO, FlashSaleSummaryDTO } from "../types/dto";
import type { Product, ProductVariant, Ingredient, FlashSaleSummary } from "../types/domain";
import { getDisplayVariantStock, getEffectiveVariantPrice, getLiveFlashSale } from "../product.utils";

export type ProductSortBy = "popular" | "price-low" | "price-high";

const mapVariantDTOToDomain = (dto: ProductVariantDTO): ProductVariant => ({
    id: dto.id,
    sku: dto.sku,
    unitType: dto.unitType ?? dto.unit ?? dto.variantName ?? "Sản phẩm",
    specification: dto.specification ?? null,
    salePrice: dto.salePrice,
    discountPercent: dto.discountPercent ?? null,
    availableQuantity: dto.availableQuantity ?? dto.quantityAvailable ?? null,
    isDefault: dto.isDefault,
    isActive: dto.isActive ?? true,
    flashSale: dto.flashSale ? mapFlashSaleDTOToDomain(dto.flashSale) : null,
});

interface LegacyPrice {
    measureUnitCode: number;
    measureUnitName: string;
    price: number;
    currencySymbol: string;
    productSpecs: string;
}

const mapFlashSaleDTOToDomain = (dto: FlashSaleSummaryDTO): FlashSaleSummary => ({
    id: dto.id,
    campaignId: dto.campaignId ?? null,
    campaignName: dto.campaignName ?? null,
    flashPrice: dto.flashPrice,
    originalPrice: dto.originalPrice ?? null,
    remainingStock: dto.remainingStock,
    saleStock: dto.saleStock ?? null,
    perUserLimit: dto.perUserLimit ?? null,
    startAt: dto.startAt ?? null,
    endAt: dto.endAt ?? null,
    status: dto.status ?? null,
});

const mapLegacyPricesToVariants = (
    prices: LegacyPrice[] | undefined,
    quantityAvailable: number | undefined
): ProductVariant[] => {
    if (!prices || prices.length === 0) return [];
    return prices.map((p, idx) => ({
        id: `legacy-${idx}`,
        sku: "",
        unitType: p.measureUnitName || "Sản phẩm",
        specification: p.productSpecs || null,
        salePrice: p.price,
        discountPercent: null,
        availableQuantity: quantityAvailable ?? null,
        isDefault: idx === 0,
        isActive: true,
    }));
};

const mapIngredientDTOToDomain = (dto: IngredientDTO): Ingredient => ({
    ingredientId: dto.ingredientId,
    name: dto.name,
    shortDescription: dto.shortDescription,
});

const normalizeRichText = (value: string | string[] | null | undefined): string | null => {
    if (Array.isArray(value)) {
        const filtered = value.map(v => v?.trim()).filter(Boolean);
        return filtered.length ? `<p>${filtered.join("</p><p>")}</p>` : null;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }

    return null;
};

const mapProductDTOToDomain = (dto: ProductDTO): Product => {
    const variants: ProductVariant[] =
        dto.variants && dto.variants.length > 0
            ? dto.variants.map(mapVariantDTOToDomain)
            : mapLegacyPricesToVariants(dto.prices, dto.quantityAvailable);

    const ingredientsList = dto.ingredients || dto.ingredient || [];

    return {
        id: dto.id,
        code: dto.code ?? null,
        slug: dto.slug,
        name: dto.name,
        webName: dto.webName ?? null,
        brand: dto.brand ?? null,
        brandOrigin: dto.brandOrigin ?? null,
        producer: dto.producer ?? null,
        description: normalizeRichText(dto.description),
        careful: normalizeRichText(dto.careful),
        adverseEffect: normalizeRichText(dto.adverseEffect),
        preservation: normalizeRichText(dto.preservation),
        usage: normalizeRichText(dto.usage),
        dosage: normalizeRichText(dto.dosage),
        primaryImage: dto.primaryImage ?? null,
        secondaryImages: dto.secondaryImages || [],
        images: (dto.images || []).map(img => ({
            id: img.id,
            url: img.url,
            sortOrder: img.sortOrder,
        })),
        ingredients: ingredientsList.map(mapIngredientDTOToDomain),
        categories: dto.categories || [],
        variants,
        defaultVariantId: dto.defaultVariantId ?? null,
        averageRating: dto.averageRating || 0,
        totalReviews: dto.totalReviews || 0,
    };
};

export function getDefaultVariant(variants: ProductVariant[]): ProductVariant | null {
    if (!variants.length) return null;
    return (
        variants.find(v => getLiveFlashSale(v) && v.isActive && (getDisplayVariantStock(v) == null || getDisplayVariantStock(v)! > 0)) ??
        variants.find(v => v.isDefault && v.isActive && (v.availableQuantity == null || v.availableQuantity > 0)) ??
        variants.find(v => v.isActive && (v.availableQuantity == null || v.availableQuantity > 0)) ??
        variants.find(v => v.isDefault && v.isActive) ??
        variants.find(v => v.isActive) ??
        variants[0]
    );
}

export function getPreferredVariant(
    variants: ProductVariant[],
    sortBy: ProductSortBy = "popular"
): ProductVariant | null {
    const activeVariants = variants.filter(v => v.isActive);

    if (activeVariants.length === 0) {
        return getDefaultVariant(variants);
    }

    if (sortBy === "price-low") {
        return activeVariants.reduce((lowest, current) =>
            getEffectiveVariantPrice(current) < getEffectiveVariantPrice(lowest) ? current : lowest
        );
    }

    if (sortBy === "price-high") {
        return activeVariants.reduce((highest, current) =>
            getEffectiveVariantPrice(current) > getEffectiveVariantPrice(highest) ? current : highest
        );
    }

    return getDefaultVariant(variants) ?? activeVariants[0];
}

export function getLowestPrice(variants: ProductVariant[]): number | null {
    const activePrices = variants
        .filter(v => v.isActive)
        .map(v => getEffectiveVariantPrice(v));
    if (activePrices.length === 0) return null;
    return Math.min(...activePrices);
}

export function hasAvailableStock(variants: ProductVariant[]): boolean {
    return variants.some(
        v => v.isActive && (getDisplayVariantStock(v) == null || getDisplayVariantStock(v)! > 0)
    );
}

export const productService = {
    getProducts: async (
        page: number,
        categorySlug?: string,
        sortBy?: string,
        minPrice?: number,
        maxPrice?: number,
        search?: string,
        size?: number
    ) => {
        const res = await productApi.getProductList(page, categorySlug, sortBy, minPrice, maxPrice, search, size);
        return {
            ...res,
            products: res.products.map(mapProductDTOToDomain),
        };
    },

    getProductById: async (productId: string): Promise<Product> => {
        const dto = await productApi.getProductDetails(productId);
        return mapProductDTOToDomain(dto);
    },

    getProductBySku: async (sku: string): Promise<Product> => {
        const dto = await productApi.getProductBySku(sku);
        return mapProductDTOToDomain(dto);
    },

    getProductBySlug: async (slug: string): Promise<Product> => {
        const dto = await productApi.getProductDetailsBySlug(slug);
        return mapProductDTOToDomain(dto);
    },
};
