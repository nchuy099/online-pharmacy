import type { AddressDTO, AddressListRespDTO } from "../types/dto";
import type { Address } from "../types/domain";

/**
 * Transform AddressDTO (API response) to Address (domain model)
 */
export const mapAddressResponse = (resp: AddressDTO): Address => {
    return {
        id: resp.id,
        fullName: resp.fullName,
        phoneNumber: resp.phoneNumber,
        address: resp.address,
        ghnProvinceId: resp.ghnProvinceId,
        ghnDistrictId: resp.ghnDistrictId,
        ghnWardCode: resp.ghnWardCode,
        provinceName: resp.provinceName,
        districtName: resp.districtName,
        wardName: resp.wardName,
        fullAddress: resp.fullAddress,
        isDefault: resp.isDefault
    };
};

/**
 * Transform AddressListRespDTO to Address[]
 */
export const mapAddressListResponse = (resp: AddressListRespDTO): Address[] => {
    return resp.addresses.map(mapAddressResponse);
};
