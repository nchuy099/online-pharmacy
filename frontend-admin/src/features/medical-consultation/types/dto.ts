import { Pagination } from '../../../shared/types';

export interface MedicalConsultationSummary {
    total: number;
    active: number;
    closed: number;
    unassigned: number;
}

export interface MedicalConsultationListItem {
    id: string;
    customerId?: string | null;
    customerName: string;
    pharmacistId?: string | null;
    pharmacistName?: string | null;
    specialtyCode?: string | null;
    specialtyName?: string | null;
    consultationId?: string | null;
    type: string;
    status: string;
    title: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MedicalConsultationListResponse {
    consultations: MedicalConsultationListItem[];
    pagination: Pagination;
    stats: MedicalConsultationSummary;
}

export interface MedicalConsultationTimelineEvent {
    type: string;
    label: string;
    occurredAt?: string;
}

export interface MedicalConsultationPrescriptionItem {
    id: string;
    productId: string;
    productName: string;
    productWebName?: string;
    productImageUrl?: string;
    quantity: number;
    instructions: string;
}

export interface MedicalConsultationPrescription {
    id: string;
    customerId: string;
    customerName: string;
    pharmacistId: string;
    pharmacistName: string;
    diagnosis: string;
    generalInstructions?: string;
    followUpDate?: string;
    createdAt?: string;
    items: MedicalConsultationPrescriptionItem[];
}

export interface MedicalConsultationDetail {
    id: string;
    customerId?: string | null;
    customerName: string;
    pharmacistId?: string | null;
    pharmacistName?: string | null;
    specialtyCode?: string | null;
    specialtyName?: string | null;
    consultationId?: string | null;
    type: string;
    status: string;
    title: string;
    summary?: string | null;
    createdAt?: string;
    updatedAt?: string;
    timeline: MedicalConsultationTimelineEvent[];
    prescriptions: MedicalConsultationPrescription[];
}
