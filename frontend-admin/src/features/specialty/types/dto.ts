import { Pagination } from '../../../shared/types';
import { Specialty } from './domain';

export interface SpecialtyResponse {
    id: string;
    code: string;
    name: string;
}

export interface CreateSpecialtyParams {
    code: string;
    name: string;
}

export interface UpdateSpecialtyParams extends CreateSpecialtyParams {
    id: string;
}

export interface SpecialtyPageResponse {
    specialties: Specialty[];
    pagination?: Pagination;
}
