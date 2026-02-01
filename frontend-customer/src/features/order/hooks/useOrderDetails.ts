import { useQuery } from "@tanstack/react-query";
import { orderService } from "../services/order.service";

export const useOrderDetails = (orderId: string | undefined) => {
    return useQuery({
        queryKey: ["order", orderId],
        queryFn: () => orderService.getDetails(orderId!),
        enabled: !!orderId
    });
};
