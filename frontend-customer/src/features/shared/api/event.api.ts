import axios from './axios';
import type { ApiResponse } from './types/api';
import type { CreateEventRequest } from '../types/event';

export const eventApi = {
    trackEvent: async (request: CreateEventRequest): Promise<void> => {
        try {
            await axios.post<ApiResponse<void>>('/events', request);
        } catch (error) {
            console.error('Failed to track event:', error);
            // We usually don't want event tracking failure to break the user experience
        }
    }
};
