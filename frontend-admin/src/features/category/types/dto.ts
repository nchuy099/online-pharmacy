import { Pagination } from '../../../shared/types';
import { Category } from './domain';

export interface CategoryListResponse {
    categories: Category[];
    pagination?: Pagination;
}

export interface CategoryResponse {
    category: Category;
}
