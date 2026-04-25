import type { ProductVariant } from "./types/domain";

type FlashSaleSummary = NonNullable<ProductVariant["flashSale"]>;

export const formatUnitType = (unitType: string | undefined): string => {
    if (!unitType) return "Sản phẩm";

    const mapping: Record<string, string> = {
        Capsule: "Viên nang",
        Tablet: "Viên nén",
        Bottle: "Chai",
        Box: "Hộp",
        Tube: "Tuýp",
        Sachet: "Gói",
        Ampoule: "Ống",
        Vial: "Lọ",
        Pill: "Viên",
        Blister: "Vỉ",
        Patch: "Miếng dán",
        Spray: "Bình xịt",
        Syrup: "Siro",
        Cream: "Kem",
        Gel: "Gel",
        Ointment: "Thuốc mỡ",
        Unit: "Đơn vị",
        HOP: "Hộp",
        VI: "Vỉ",
        VIEN: "Viên",
        CHAI: "Chai",
        GOI: "Gói",
        TUOI: "Tuýp",
        ONG: "Ống",
        LO: "Lọ",
    };

    const normalizedUnit = Object.keys(mapping).find(
        key => key.toLowerCase() === unitType.toLowerCase()
    );

    return normalizedUnit ? mapping[normalizedUnit] : unitType;
};

export const formatVND = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount);
};

const parseFlashSaleTime = (value?: string | null): number | null => {
    if (!value) {
        return null;
    }
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
};

export const getLiveFlashSale = (variant: ProductVariant | null | undefined): FlashSaleSummary | null => {
    const flashSale = variant?.flashSale;
    if (!flashSale) {
        return null;
    }

    const now = Date.now();
    const startAt = parseFlashSaleTime(flashSale.startAt);
    const endAt = parseFlashSaleTime(flashSale.endAt);

    if (startAt != null && now < startAt) {
        return null;
    }
    if (endAt != null && now >= endAt) {
        return null;
    }

    return flashSale;
};

export const getEffectiveVariantPrice = (variant: ProductVariant): number => {
    return getLiveFlashSale(variant)?.flashPrice ?? variant.salePrice;
};

export const getDisplayVariantStock = (variant: ProductVariant): number | null => {
    const flashSale = getLiveFlashSale(variant);
    if (flashSale) {
        return flashSale.remainingStock ?? 0;
    }
    return variant.availableQuantity ?? null;
};

export const getVariantLabel = (variant: ProductVariant): string => {
    const unitType = formatUnitType(variant.unitType);
    if (variant.specification?.trim()) {
        return `${unitType} - ${variant.specification.trim()}`;
    }
    return unitType;
};

export const isVariantPurchasable = (variant: ProductVariant): boolean => {
    const availableStock = getDisplayVariantStock(variant);
    return variant.isActive && (availableStock == null || availableStock > 0);
};
