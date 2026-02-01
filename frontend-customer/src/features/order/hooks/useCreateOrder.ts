import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/order.service";
import type { CreateOrderReqDTO } from "../types/dto";

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (req: CreateOrderReqDTO) =>
            orderService.create(req),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
    });
};
