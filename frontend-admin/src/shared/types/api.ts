// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
    success: boolean;
    code: string;
    status: number;
    message?: string;
    data?: T;
    error?: string;
    // errorCode?: string;
}
