import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import { MedicalConsultationDetail, MedicalConsultationListResponse } from '../types/dto';

const medicalConsultationApi = {
    async getList(params: {
        page?: number;
        size?: number;
        search?: string;
        status?: string;
        type?: string;
        specialty?: string;
        assigned?: boolean;
    }): Promise<ApiResponse<MedicalConsultationListResponse>> {
        const res = await axios.get('/admin/medical-consultations', { params });
        return res.data;
    },

    async getDetail(id: string): Promise<ApiResponse<MedicalConsultationDetail>> {
        const res = await axios.get(`/admin/medical-consultations/${id}`);
        return res.data;
    },
};

export default medicalConsultationApi;
