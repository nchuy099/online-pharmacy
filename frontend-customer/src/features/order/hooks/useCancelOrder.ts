import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';

interface CancelOrderParams {
    orderId: string;
    reason?: string;
}

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, reason }: CancelOrderParams) =>
            orderService.cancel(orderId, reason),
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        }
    });
};
