import { useQuery } from "@tanstack/react-query";
import { addressService } from "../services/address.service";

export const useAddressList = (page: number = 1, size: number = 10) => {
    const query = useQuery({
        queryKey: ["addressList", page, size],
        queryFn: () => addressService.getList(page, size),
    });

    return {
        ...query,
        data: query.data ?? [],
    };
};

