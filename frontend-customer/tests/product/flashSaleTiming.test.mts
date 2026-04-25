import assert from "node:assert/strict";

import {
    getDisplayVariantStock,
    getEffectiveVariantPrice,
    getLiveFlashSale,
} from "../../src/features/product/product.utils.ts";
import type { ProductVariant } from "../../src/features/product/types/domain.ts";

const baseVariant: ProductVariant = {
    id: "variant-1",
    sku: "SKU-1",
    unitType: "Hộp",
    salePrice: 100000,
    availableQuantity: 12,
    isDefault: true,
    isActive: true,
};

const now = Date.now();

const scheduledVariant: ProductVariant = {
    ...baseVariant,
    flashSale: {
        id: "flash-1",
        flashPrice: 75000,
        remainingStock: 3,
        startAt: new Date(now + 5 * 60_000).toISOString(),
        endAt: new Date(now + 65 * 60_000).toISOString(),
    },
};

assert.equal(
    getLiveFlashSale(scheduledVariant),
    null,
    "scheduled flash sale should not be treated as active before startAt",
);
assert.equal(
    getEffectiveVariantPrice(scheduledVariant),
    100000,
    "scheduled flash sale should not override the normal sale price",
);
assert.equal(
    getDisplayVariantStock(scheduledVariant),
    12,
    "scheduled flash sale should not override the normal stock",
);

const liveVariant: ProductVariant = {
    ...baseVariant,
    flashSale: {
        id: "flash-2",
        flashPrice: 69000,
        remainingStock: 2,
        startAt: new Date(now - 60_000).toISOString(),
        endAt: new Date(now + 60_000).toISOString(),
    },
};

assert.equal(
    getLiveFlashSale(liveVariant)?.id,
    "flash-2",
    "flash sale should become active during its time window",
);
assert.equal(
    getEffectiveVariantPrice(liveVariant),
    69000,
    "active flash sale should override the displayed price",
);
assert.equal(
    getDisplayVariantStock(liveVariant),
    2,
    "active flash sale should override the displayed stock",
);
