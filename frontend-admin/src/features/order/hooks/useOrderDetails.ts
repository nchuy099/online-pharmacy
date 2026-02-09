import { useCallback, useEffect, useState } from 'react';
import orderService from '../services';
import { OrderDetails } from '../types/domain';

export const useOrderDetails = (orderId?: string) => {
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        if (!orderId) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await orderService.getDetails(orderId);
            setOrder(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { order, isLoading, error, refresh };
};
