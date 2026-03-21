import assert from "node:assert/strict";

import { getTopLevelCategoriesByProductCount } from "../../src/features/shared/utils/topCategories.ts";

const categories = [
    { id: "1", slug: "a", name: "A", level: 1, productCount: 4 },
    { id: "2", slug: "b", name: "B", level: 2, productCount: 999 },
    { id: "3", slug: "c", name: "C", level: 1, productCount: 15 },
    { id: "4", slug: "d", name: "D", level: 1, productCount: undefined },
    { id: "5", slug: "e", name: "E", level: 1, productCount: 2 },
    { id: "6", slug: "f", name: "F", level: 1, productCount: 9 },
    { id: "7", slug: "g", name: "G", level: 1, productCount: 21 },
    { id: "8", slug: "h", name: "H", level: 1, productCount: 11 },
    { id: "9", slug: "i", name: "I", level: 1, productCount: 7 },
];

assert.deepEqual(
    getTopLevelCategoriesByProductCount(categories).map((category) => category.slug),
    ["g", "c", "h", "f", "i", "a"],
    "should return the top 6 level 1 categories sorted by productCount descending",
);

assert.equal(
    getTopLevelCategoriesByProductCount(categories).length,
    6,
    "should cap the visible categories at 6 items",
);
