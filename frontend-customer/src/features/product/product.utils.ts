import type { ProductVariant } from "./types/domain";

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

export const getVariantLabel = (variant: ProductVariant): string => {
    const unitType = formatUnitType(variant.unitType);
    if (variant.specification?.trim()) {
        return `${unitType} - ${variant.specification.trim()}`;
    }
    return unitType;
};

export const isVariantPurchasable = (variant: ProductVariant): boolean => {
    return variant.isActive && (variant.availableQuantity == null || variant.availableQuantity > 0);
};
