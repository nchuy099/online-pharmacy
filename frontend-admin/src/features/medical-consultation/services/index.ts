import medicalConsultationApi from '../api';
import { MedicalConsultationDetail, MedicalConsultationListResponse } from '../types/dto';

const medicalConsultationService = {
    async getList(params: {
        page?: number;
        size?: number;
        search?: string;
        status?: string;
        type?: string;
        specialty?: string;
        assigned?: boolean;
    }): Promise<MedicalConsultationListResponse> {
        const res = await medicalConsultationApi.getList(params);
        if (!res.data) {
            throw new Error(res.message || 'Failed to get medical consultations');
        }
        return res.data;
    },

    async getDetail(id: string): Promise<MedicalConsultationDetail> {
        const res = await medicalConsultationApi.getDetail(id);
        if (!res.data) {
            throw new Error(res.message || 'Failed to get medical consultation detail');
        }
        return res.data;
    },
};

export default medicalConsultationService;
