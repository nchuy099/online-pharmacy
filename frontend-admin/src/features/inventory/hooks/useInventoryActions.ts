import { useCallback, useState } from 'react';
import inventoryService from '../services';

export const useInventoryActions = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const importStock = useCallback(async (variantId: string, quantity: number, unitCost: number, note?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            return await inventoryService.importStock(variantId, quantity, unitCost, note);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { importStock, isLoading, error };
};

export default useInventoryActions;
