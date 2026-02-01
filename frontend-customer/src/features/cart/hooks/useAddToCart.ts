import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../services/cart.service";
import type { AddItemToCartReqDTO } from "../types/dto";

export const useAddToCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (req: AddItemToCartReqDTO) => cartService.addItem(req),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
    });
};