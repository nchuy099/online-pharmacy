import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../services/cart.service";

export const useRemoveCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (itemId: string) => cartService.removeItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
    });
};
