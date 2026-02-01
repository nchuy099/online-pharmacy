import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addressService } from "../services/address.service";

type CreateAddressParams = {
    fullName: string;
    phoneNumber: string;
    address: string;
    ghnProvinceId: number;
    ghnDistrictId: number;
    ghnWardCode: string;
    provinceName: string;
    districtName: string;
    wardName: string;
    isDefault?: boolean;
}

export const useCreateAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: CreateAddressParams) =>
            addressService.create(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addressList"] });
            queryClient.invalidateQueries({ queryKey: ["defaultAddress"] });
        },
    });
};

type UpdateAddressParams = {
    id: string;
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    ghnProvinceId?: number;
    ghnDistrictId?: number;
    ghnWardCode?: string;
    provinceName?: string;
    districtName?: string;
    wardName?: string;
    isDefault?: boolean;
}

export const useUpdateAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...params }: UpdateAddressParams) =>
            addressService.update(id, params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addressList"] });
            queryClient.invalidateQueries({ queryKey: ["defaultAddress"] });
        },
    });
};

export const useDeleteAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => addressService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["addressList"] });
            queryClient.invalidateQueries({ queryKey: ["defaultAddress"] });
        },
    });
};
