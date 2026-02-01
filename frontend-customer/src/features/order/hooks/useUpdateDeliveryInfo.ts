import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import type { ShippingInfo } from '../types/domain';

interface UpdateDeliveryInfoParams {
    orderId: string;
    shippingInfo?: ShippingInfo;
    note?: string;
}

export const useUpdateDeliveryInfo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, shippingInfo, note }: UpdateDeliveryInfoParams) =>
            orderService.updateDeliveryInfo(orderId, shippingInfo as ShippingInfo, note),
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        }
    });
};
