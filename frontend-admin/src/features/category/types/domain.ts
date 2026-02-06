export interface Category {
    id: string | undefined;
    code?: string;
    slug?: string;
    name: string;
    parentId?: string | null;
    parentName?: string | null;
    level: number;
    isActive: boolean;
}
