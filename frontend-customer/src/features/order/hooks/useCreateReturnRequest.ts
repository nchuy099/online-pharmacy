import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/order.service";

type CreateReturnRequestParams = {
    orderId: string;
    reason: string;
    files?: File[];
};

export const useCreateReturnRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, reason, files = [] }: CreateReturnRequestParams) => {
            const imageUrls = [];
            for (const file of files) {
                imageUrls.push(await orderService.uploadReturnEvidence(orderId, file));
            }
            return orderService.createReturnRequest(orderId, reason, imageUrls);
        },
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
};
