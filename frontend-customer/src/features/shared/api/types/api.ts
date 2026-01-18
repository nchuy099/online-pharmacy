export type ApiResponse<T> = {
    success: boolean;
    code: string;
    status: number;
    message: string;
    data: T;
    error?: string;
}

export type Pagination = {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
}

export type Cursor = {
    nextCursor: string | null;
    hasMore: boolean
}
