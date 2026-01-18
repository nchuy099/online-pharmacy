import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,              // retry 1 lần nếu lỗi
            refetchOnWindowFocus: false, // không tự refetch khi quay lại tab
        },
    },
})
