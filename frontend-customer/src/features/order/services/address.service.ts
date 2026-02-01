import { AddressApi } from "../api/AddressApi";
import type { Address } from "../types/domain";
import type { CreateAddressReqDTO, UpdateAddressReqDTO } from "../types/dto";
import {
    mapAddressResponse,
    mapAddressListResponse,
} from "../mappers/address.mapper";

export const addressService = {
    getList: async (page: number = 1, size: number = 10): Promise<Address[]> => {
        const resp = await AddressApi.getList(page, size);
        return mapAddressListResponse(resp);
    },

    create: async (data: CreateAddressReqDTO): Promise<Address> => {
        const resp = await AddressApi.create(data);
        return mapAddressResponse(resp);
    },

    update: async (id: string, data: UpdateAddressReqDTO): Promise<Address> => {
        const resp = await AddressApi.update(id, data);
        return mapAddressResponse(resp);
    },

    delete: async (id: string): Promise<void> => {
        await AddressApi.delete(id);
    },
};
