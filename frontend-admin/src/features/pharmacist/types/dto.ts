import { Pagination } from '../../../shared/types';

export const getSpecialistName = (code: string | null | undefined, fallbackName?: string): string => {
    if (fallbackName && fallbackName.trim()) {
        return fallbackName;
    }
    if (!code) return 'N/A';
    return code.toString().trim().toUpperCase();
};

export interface PharmacistResponse {
    id: string;
    userId: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    avatarUrl?: string;
    qualifications?: string;
    education?: string;
    experience?: string;
    specialtyCode?: string;
    specialtyName?: string;
    isApproved?: boolean;
    maxSessions?: number;
    autoAssign?: boolean;
    activeSessions: number;
    rating?: number;
    totalConsultations?: number;
    createdAt?: string;
}

export interface PharmacistPageResponse {
    pharmacists: PharmacistResponse[];
    pagination: Pagination;
    totalActive: number;
    totalBusy: number;
}

export interface CreatePharmacistParams {
    email: string;
    fullName: string;
    password?: string;
    phoneNumber: string;
}

export interface UpdatePharmacistParams {
    qualifications?: string;
    education?: string;
    experience?: string;
    specialtyCode?: string;
    isApproved?: boolean;
    maxSessions?: number;
    autoAssign?: boolean;
}

export interface PharmacistDetailsResponse extends PharmacistResponse {}
export interface Pharmacist {}
