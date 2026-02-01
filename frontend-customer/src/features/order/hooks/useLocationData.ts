import { useState, useCallback } from 'react';
import { fetchProvinces, fetchDistricts, fetchWards, type Province, type District, type Ward } from '../api/LocationApi';

export const useLocationData = (initialProvinceId?: number, initialDistrictId?: number, initialWardCode?: string) => {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    const [selectedProvince, setSelectedProvince] = useState<number | "">(initialProvinceId || "");
    const [selectedDistrict, setSelectedDistrict] = useState<number | "">(initialDistrictId || "");
    const [selectedWard, setSelectedWard] = useState<string>(initialWardCode || "");

    const loadProvinces = useCallback(async () => {
        try {
            const data = await fetchProvinces();
            setProvinces(data);
            return data;
        } catch (error) {
            console.error("Failed to load provinces", error);
            return [];
        }
    }, []);

    const loadDistricts = useCallback(async (provinceId: number) => {
        try {
            const data = await fetchDistricts(provinceId);
            setDistricts(data);
            return data;
        } catch (error) {
            console.error("Failed to load districts", error);
            return [];
        }
    }, []);

    const loadWards = useCallback(async (districtId: number) => {
        try {
            const data = await fetchWards(districtId);
            setWards(data);
            return data;
        } catch (error) {
            console.error("Failed to load wards", error);
            return [];
        }
    }, []);

    const handleProvinceChange = useCallback(async (provinceId: number) => {
        setSelectedProvince(provinceId || "");
        setSelectedDistrict("");
        setSelectedWard("");
        setWards([]);
        if (provinceId) {
            await loadDistricts(provinceId);
        } else {
            setDistricts([]);
        }
    }, [loadDistricts]);

    const handleDistrictChange = useCallback(async (districtId: number) => {
        setSelectedDistrict(districtId || "");
        setSelectedWard("");
        if (districtId) {
            await loadWards(districtId);
        } else {
            setWards([]);
        }
    }, [loadWards]);

    const handleWardChange = useCallback((wardCode: string) => {
        setSelectedWard(wardCode);
    }, []);

    const resetLocation = useCallback(() => {
        setSelectedProvince("");
        setSelectedDistrict("");
        setSelectedWard("");
        setDistricts([]);
        setWards([]);
    }, []);

    const initializeWithAddress = useCallback(async (provinceId?: number, districtId?: number, wardCode?: string) => {
        await loadProvinces();
        if (provinceId) {
            setSelectedProvince(provinceId);
            await loadDistricts(provinceId);
            if (districtId) {
                setSelectedDistrict(districtId);
                await loadWards(districtId);
                if (wardCode) {
                    setSelectedWard(wardCode);
                }
            }
        }
    }, [loadProvinces, loadDistricts, loadWards]);

    const getSelectedNames = useCallback(() => {
        const province = provinces.find(p => p.ghnProvinceId === selectedProvince);
        const district = districts.find(d => d.ghnDistrictId === selectedDistrict);
        const ward = wards.find(w => w.ghnWardCode === selectedWard);
        return { province, district, ward };
    }, [provinces, districts, wards, selectedProvince, selectedDistrict, selectedWard]);

    return {
        provinces,
        districts,
        wards,
        selectedProvince,
        selectedDistrict,
        selectedWard,
        handleProvinceChange,
        handleDistrictChange,
        handleWardChange,
        resetLocation,
        loadProvinces,
        initializeWithAddress,
        getSelectedNames,
    };
};
