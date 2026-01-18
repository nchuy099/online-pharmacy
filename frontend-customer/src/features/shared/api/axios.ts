import axiosLib from 'axios'
import { isUserLockedApiError, resolveApiErrorMessage } from './error';
import { AUTH_USER_LOCKED_EVENT } from '@/features/auth/auth.constants';

const instance = axiosLib.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// A separate instance for refreshing to avoid interceptor recursion
const refreshInstance = axiosLib.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const isAuthEndpoint = (url?: string) => {
    return url?.includes('/auth/refresh-token') || url?.includes('/auth/login');
};

// Request interceptor
instance.interceptors.request.use(
    config => {
        if (isAuthEndpoint(config.url)) {
            return config;
        }

        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    error => Promise.reject(error)
);

// Response interceptor variables
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string | null) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/';
};

const emitUserLocked = () => {
    window.dispatchEvent(new Event(AUTH_USER_LOCKED_EVENT));
};

// Response interceptor
instance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (isUserLockedApiError(error)) {
            if (isRefreshing) {
                processQueue(error);
                isRefreshing = false;
            }
            emitUserLocked();
            error.message = resolveApiErrorMessage(error, error.message);
            return Promise.reject(error);
        }

        if (error.response?.data) {
            error.message = resolveApiErrorMessage(error, error.message);
        }

        if (error.response?.status === 401) {
            // Case 1: 401 from Auth endpoints (refresh or login) -> fail and logout
            if (isAuthEndpoint(originalRequest.url)) {
                if (!originalRequest.url?.includes('/auth/login')) {
                    handleLogout();
                }
                return Promise.reject(error);
            }

            // Case 2: Already retried -> fail and logout
            if (originalRequest._retry) {
                handleLogout();
                return Promise.reject(error);
            }

            // Case 3: Concurrent refresh
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return instance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            // Start refresh
            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                handleLogout();
                return Promise.reject(error);
            }

            try {
                const response = await refreshInstance.post('/auth/refresh-token', { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return instance(originalRequest);
            } catch (refreshError: any) {
                processQueue(refreshError, null);
                if (isUserLockedApiError(refreshError)) {
                    emitUserLocked();
                    if (refreshError && typeof refreshError === "object") {
                        (refreshError as { message?: string }).message = resolveApiErrorMessage(
                            refreshError,
                            (refreshError as { message?: string }).message || "Tài khoản đã bị khóa."
                        );
                    }
                    return Promise.reject(refreshError);
                }
                handleLogout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
