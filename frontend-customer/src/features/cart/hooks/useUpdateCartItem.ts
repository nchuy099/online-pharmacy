import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../services/cart.service";
import type { UpdateCartItemReqDTO } from "../types/dto";

export const useUpdateCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (req: UpdateCartItemReqDTO) => cartService.updateItem(req),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
    });
};
