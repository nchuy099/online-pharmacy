import { useMutation } from "@tanstack/react-query";
import { orderService } from "../services/order.service";
import type { CreateOrderCheckoutReqDTO } from "../types/dto";

export const useCreateCheckout = () => {
    return useMutation({
        mutationFn: (req: CreateOrderCheckoutReqDTO) =>
            orderService.checkout(req),
    });
};
