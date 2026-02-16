import api from '../../../shared/api/axiosInstance';
import type { PatientHistoryResponse, PrescriptionRequest, PrescriptionResponse } from '../types/patient';

export const patientApi = {
    getPatientHistory: async (
        customerId: string,
        params?: {
            orderPage?: number;
            orderSize?: number;
            rxPage?: number;
            rxSize?: number;
        }
    ): Promise<PatientHistoryResponse> => {
        const response = await api.get(`/pharmacists/customers/${customerId}/history`, { params });
        return response.data.data;
    },

    createPrescription: async (request: PrescriptionRequest): Promise<PrescriptionResponse> => {
        const response = await api.post('/pharmacists/prescriptions', request);
        return response.data.data;
    }
};
