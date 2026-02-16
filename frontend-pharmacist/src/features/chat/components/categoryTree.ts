import type { CategoryDTO } from "../types/dto";

export const findCategoryTrailBySlug = (categories: CategoryDTO[], slug: string): CategoryDTO[] | null => {
    if (!slug) return [];

    const trail: CategoryDTO[] = [];
    const dfs = (nodes: CategoryDTO[]): boolean => {
        for (const node of nodes) {
            if (node.slug === slug) {
                return true;
            }

            trail.push(node);
            if (node.children?.length && dfs(node.children)) {
                return true;
            }
            trail.pop();
        }
        return false;
    };

    return dfs(categories) ? [...trail] : null;
};

export const findCategoryBySlug = (categories: CategoryDTO[], slug: string): CategoryDTO | null => {
    for (const category of categories) {
        if (category.slug === slug) {
            return category;
        }
        const found = category.children?.length ? findCategoryBySlug(category.children, slug) : null;
        if (found) return found;
    }
    return null;
};

export const getCategoryPathLabel = (categories: CategoryDTO[], slug: string): string => {
    if (!slug) return "";

    const path = findCategoryTrailBySlug(categories, slug);
    if (path === null) return "";

    const current = findCategoryBySlug(categories, slug);
    return [...path, ...(current ? [current] : [])].map((category) => category.name).join(" / ");
};
