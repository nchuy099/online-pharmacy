import { useMutation, useQueryClient } from "@tanstack/react-query"
import { orderService } from "../services/order.service"
import type { CreateOrderReqDTO } from "../types/dto"

export const useCreateOrder = () => {
    return useMutation({
        mutationFn: (req: CreateOrderReqDTO) => orderService.create(req)
    });
}

type CancelOrderParams = {
    orderId: string,
    reason?: string
}

export const useCancelOrder = () => {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: ({ orderId, reason }: CancelOrderParams) => orderService.cancel(orderId, reason),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ["order", id] })
            qc.invalidateQueries({ queryKey: ["orders"] })
        },
    })
}
