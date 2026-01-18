import type { Category } from "@/features/product/types/domain";

const CATEGORY_LIMIT = 6;

export const getTopLevelCategoriesByProductCount = (categories: Category[]): Category[] => {
    return categories
        .filter((category) => category.level === 1)
        .sort((left, right) => (right.productCount ?? 0) - (left.productCount ?? 0))
        .slice(0, CATEGORY_LIMIT);
};
