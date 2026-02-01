import { useInfiniteQuery } from "@tanstack/react-query";
import { cartService } from "../services/cart.service";
import { useAuthContext } from "@/features/auth/context/AuthContext";

export const useCart = (size: number = 10, enabled: boolean = true) => {
    const { user } = useAuthContext();
    
    return useInfiniteQuery({
        queryKey: ["cart", user?.id, size],
        queryFn: ({ pageParam }) => {
            const cursor = (pageParam as string) || undefined;
            return cartService.getCart(size, cursor);
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage?.hasMore ? lastPage.nextCursor : null,
        enabled: enabled && !!user,
    });
};


