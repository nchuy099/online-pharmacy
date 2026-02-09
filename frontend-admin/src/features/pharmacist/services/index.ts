import pharmacistApi from '../api';
import { CreatePharmacistParams, PharmacistPageResponse, PharmacistResponse, UpdatePharmacistParams } from '../types/dto';

const mapToPharmacist = (item: any): PharmacistResponse => ({
    ...item,
    id: item?.id,
    userId: item?.userId || item?.id,
    activeSessions: item?.activeSessions ?? 0,
});

const pharmacistService = {
    async getList(
        page: number = 1,
        size: number = 10,
        search?: string,
        specialty?: string,
        status?: string
    ): Promise<PharmacistPageResponse> {
        const res = await pharmacistApi.getList(page, size, search, specialty, status);
        const data = res as any; // ApiResponse structure

        // Extracting data from ApiResponse structure: { success: true, code: "SUCCESS", status: 200, message: "Success", data: { users: [], pagination: {} } }
        const actualData = data.data || data;

        const users = actualData.users || (Array.isArray(actualData) ? actualData : []);
        const pharmacists = Array.isArray(users) ? users.map(mapToPharmacist) : [];
        const pagination = actualData.pagination || { page, size, totalElements: pharmacists.length, totalPages: 1 };

        return {
            pharmacists,
            pagination,
            totalActive: actualData.totalActive || 0,
            totalBusy: actualData.totalBusy || 0
        };
    },

    async create(payload: CreatePharmacistParams): Promise<PharmacistResponse> {
        const res = await pharmacistApi.create(payload);
        if (!res.data) throw new Error(res.message || 'Failed to create pharmacist');
        return mapToPharmacist(res.data);
    },

    async getDetails(id: string): Promise<PharmacistResponse> {
        const res = await pharmacistApi.getDetails(id);
        if (!res.data) throw new Error(res.message || 'Failed to get pharmacist details');
        return mapToPharmacist(res.data);
    },

    async update(id: string, payload: UpdatePharmacistParams): Promise<PharmacistResponse> {
        const res = await pharmacistApi.update(id, payload);
        if (!res.data) throw new Error(res.message || 'Failed to update pharmacist profile');
        return mapToPharmacist(res.data);
    },

    async remove(id: string): Promise<void> {
        await pharmacistApi.remove(id);
    },
};

export default pharmacistService;
