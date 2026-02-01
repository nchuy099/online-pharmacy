import axios from "@/features/shared/api/axios";
import type { ApiResponse } from "@/features/shared/api/types/api";

interface CatalogOption {
    id: string;
    type: string;
    code: string;
    name: string;
    parentId?: string | null;
    parentCode?: string | null;
    parentName?: string | null;
}

export interface Province {
    ghnProvinceId: number;
    name: string;
}

export interface District {
    ghnDistrictId: number;
    name: string;
}

export interface Ward {
    ghnWardCode: string;
    name: string;
}

const BASE_URL = "/catalogs/locations";

const toProvince = (item: CatalogOption): Province => ({
    ghnProvinceId: Number(item.code),
    name: item.name,
});

const toDistrict = (item: CatalogOption): District => ({
    ghnDistrictId: Number(item.code),
    name: item.name,
});

const toWard = (item: CatalogOption): Ward => ({
    ghnWardCode: item.code,
    name: item.name,
});

export const fetchProvinces = async (): Promise<Province[]> => {
    const response = await axios.get<ApiResponse<CatalogOption[]>>(`${BASE_URL}/provinces`);
    return (response.data.data || []).map(toProvince);
};

export const fetchDistricts = async (provinceId: number): Promise<District[]> => {
    const response = await axios.get<ApiResponse<CatalogOption[]>>(
        `${BASE_URL}/districts?provinceCode=${provinceId}`
    );
    return (response.data.data || []).map(toDistrict);
};

export const fetchWards = async (districtId: number): Promise<Ward[]> => {
    const response = await axios.get<ApiResponse<CatalogOption[]>>(
        `${BASE_URL}/wards?districtCode=${districtId}`
    );
    return (response.data.data || []).map(toWard);
};
