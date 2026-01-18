import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { eventApi } from '../api/event.api';
import { EventType } from '../types/event';

export const useEventTracking = () => {
    const { user } = useAuthContext();
    const [sessionId, setSessionId] = useState<string>('');

    useEffect(() => {
        let sid = localStorage.getItem('event_session_id');
        if (!sid) {
            sid = uuidv4();
            localStorage.setItem('event_session_id', sid);
        }
        setSessionId(sid);
    }, []);

    const track = useCallback(async (
        eventType: EventType,
        itemId?: string | number,
        metadata?: any
    ) => {
        await eventApi.trackEvent({
            userId: user?.id,
            eventType,
            itemId,
            sessionId,
            metadata: metadata ? JSON.stringify(metadata) : undefined
        });
    }, [user, sessionId]);

    return { track, sessionId };
};
