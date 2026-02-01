import { useState, useEffect } from "react";
import { orderService } from "../services/order.service";
import type { Order } from "../types/domain";

import type { Pagination } from "@/features/shared/api/types/api";

export const useOrderList = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        size: 10,
        totalElements: 0,
        totalPages: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async (page: number = 1) => {
        setLoading(true);
        setError(null);
        try {
            const data = await orderService.getHistory(page);
            setOrders(data.orders);
            setPagination(data.pagination);
        } catch (err: unknown) {
            setError((err as Error).message || "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(pagination.page);
    }, []);

    const goToPage = (page: number) => {
        fetchOrders(page);
    };

    return {
        orders,
        pagination,
        loading,
        error,
        goToPage,
        refetch: () => fetchOrders(pagination.page)
    };
};
