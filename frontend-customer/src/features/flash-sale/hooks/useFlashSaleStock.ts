import { useEffect, useState } from "react";
import { subscribeFlashSaleItem } from "../realtime/flashSaleSocket";

export const useFlashSaleStock = (itemId?: string | null) => {
    const [remainingStock, setRemainingStock] = useState<number | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!itemId) {
            setRemainingStock(null);
            setStatus(null);
            return;
        }

        return subscribeFlashSaleItem(itemId, (payload) => {
            setRemainingStock(payload.remainingStock);
            setStatus(payload.status);
        });
    }, [itemId]);

    return { remainingStock, status };
};
