import axiosLib from 'axios'
import { isUserLockedApiError, resolveApiErrorMessage } from './apiError';
import { AUTH_USER_LOCKED_EVENT } from '../../features/auth/auth.constants';

const instance = axiosLib.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const refreshInstance = axiosLib.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const isAuthEndpoint = (url?: string) => {
    return url?.includes('/auth/refresh-token') || url?.includes('/auth/login');
};

const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

const emitUserLocked = () => {
    window.dispatchEvent(new Event(AUTH_USER_LOCKED_EVENT));
};

// Request: gắn token
instance.interceptors.request.use(
    config => {
        // Skip adding Authorization header for auth endpoints
        if (isAuthEndpoint(config.url)) {
            return config;
        }

        const token = localStorage.getItem('accessToken');

        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    error => Promise.reject(error)
);

// Response: unwrap data + handle error
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string | null) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any = null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

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

        if (error.response?.status === 401) {
            // Trường hợp 1: Lỗi 401 từ chính endpoint refresh token hoặc login
            if (isAuthEndpoint(originalRequest.url)) {
                if (!originalRequest.url?.includes('/auth/login')) {
                    handleLogout();
                }
                return Promise.reject(error);
            }

            // Trường hợp 2: Đã retry rồi mà vẫn 401
            if (originalRequest._retry) {
                handleLogout();
                return Promise.reject(error);
            }

            // Trường hợp 3: Lỗi 401 lần đầu, thử refresh token
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
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return instance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                if (isUserLockedApiError(refreshError)) {
                    emitUserLocked();
                    if (refreshError && typeof refreshError === 'object') {
                        (refreshError as { message?: string }).message = resolveApiErrorMessage(
                            refreshError,
                            (refreshError as { message?: string }).message || 'Tài khoản đã bị khóa.'
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

        if (error.response?.data) {
            error.message = resolveApiErrorMessage(error, error.message);
        }

        return Promise.reject(error);
    }
);

export default instance;
