import { useQuery } from "@tanstack/react-query"
import { orderService } from "../services/order.service"

export const useOrderDetails = (id: string) => {
    return useQuery({
        queryKey: ["order", id],
        queryFn: () => orderService.getDetails(id),
        enabled: !!id, //ep kieu ve boolean
    })
}

export const useOrderHistory = () => {
    return useQuery({
        queryKey: ["orders"],
        queryFn: () => orderService.getHistory()
    })
}
