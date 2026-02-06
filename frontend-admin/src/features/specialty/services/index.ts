import { Pagination } from '../../../shared/types/pagination';
import specialtyApi from '../api';
import { CreateSpecialtyParams, SpecialtyResponse } from '../types/dto';
import { Specialty } from '../types/domain';

const mapToDomain = (item: SpecialtyResponse): Specialty => ({
    id: item.id,
    code: item.code,
    name: item.name,
});

const specialtyService = {
    async getList(page: number = 1, size: number = 10, search?: string): Promise<{ specialties: Specialty[]; pagination: Pagination }> {
        const res = await specialtyApi.getList(page, size, search);
        const data = res.data ?? (res as any).result;

        const content = data?.content || data?.specialties || [];

        return {
            specialties: Array.isArray(content) ? content.map(mapToDomain) : [],
            pagination: {
                page: (data?.number ?? 0) + 1,
                size: data?.size ?? 10,
                totalPages: data?.totalPages ?? 0,
                totalElements: data?.totalElements ?? 0,
            }
        };
    },

    async create(payload: CreateSpecialtyParams): Promise<Specialty> {
        const res = await specialtyApi.create(payload);
        const data = res.data ?? (res as any).result;
        if (!data) throw new Error(res.message || 'Create specialty failed');
        return mapToDomain(data);
    },

    async update(id: string, payload: CreateSpecialtyParams): Promise<Specialty> {
        const res = await specialtyApi.update(id, payload);
        const data = res.data ?? (res as any).result;
        if (!data) throw new Error(res.message || 'Update specialty failed');
        return mapToDomain(data);
    },

    async remove(id: string): Promise<void> {
        await specialtyApi.remove(id);
    },

    async getDetails(id: string): Promise<Specialty> {
        const res = await specialtyApi.getDetails(id);
        const data = res.data ?? (res as any).result;
        if (!data) throw new Error(res.message || 'Get specialty details failed');
        return mapToDomain(data);
    },
};

export default specialtyService;
