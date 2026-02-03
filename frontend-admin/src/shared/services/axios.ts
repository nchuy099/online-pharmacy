import axiosLib from "axios";
import { ApiResponse } from "../types/api";
import { API_SUCCESS_CODE } from "../constants/api";
import { isUserLockedApiError, resolveApiErrorMessage } from "./apiError";
import { AUTH_USER_LOCKED_EVENT } from "../../features/auth/auth.constants";

const BASE_URL = import.meta.env.VITE_API_URL;

const instance = axiosLib.create({
    baseURL: `${BASE_URL}`,
    headers: {
        "Content-Type": "application/json",
    },
});

const refreshInstance = axiosLib.create({
    baseURL: `${BASE_URL}`,
    headers: {
        "Content-Type": "application/json",
    },
});

const isAuthEndpoint = (url?: string) => {
    return url?.includes('/auth/refresh-token') || url?.includes('/auth/login');
};

instance.interceptors.request.use(
    (config) => {
        if (isAuthEndpoint(config.url)) {
            return config;
        }

        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Flag to track if we're refreshing token
let isRefreshing = false;
// Store pending requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let failedQueue: any[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processQueue = (error: any = null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
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

// Add a response interceptor
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
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
            if (isAuthEndpoint(originalRequest.url)) {
                if (!originalRequest.url?.includes('/auth/login')) {
                    handleLogout();
                }
                return Promise.reject(error);
            }

            if (originalRequest._retry) {
                handleLogout();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return instance(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    handleLogout();
                    return Promise.reject(error);
                }

                const response = await refreshInstance.post<ApiResponse>("/auth/refresh-token", {
                    refreshToken
                });

                if (response.data.code !== API_SUCCESS_CODE || !response.data.data.accessToken) {
                    processQueue(new Error('Token refresh failed'));
                    handleLogout();
                    return Promise.reject(new Error('Token refresh failed'));
                }

                const newAccessToken = response.data.data.accessToken;
                const newRefreshToken = response.data.data.refreshToken;

                localStorage.setItem('accessToken', newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return instance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
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
