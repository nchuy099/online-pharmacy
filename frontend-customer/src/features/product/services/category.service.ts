import { categoryApi } from "../api/category.api";
import type { CategoryDTO } from "../types/dto";
import type { Category } from "../types/domain";

const mapCategoryDTOToDomain = (dto: CategoryDTO): Category => ({
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    parentName: dto.parentName,
    level: dto.level,
    isActive: dto.isActive,
    productCount: dto.productCount,
    children: dto.children ? dto.children.map(mapCategoryDTOToDomain) : undefined,
});

export const categoryService = {
    getCategories: async (): Promise<Category[]> => {
        const dtos = await categoryApi.getCategoryList();
        return dtos.map(mapCategoryDTOToDomain);
    },
};
