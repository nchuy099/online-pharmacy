import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ActiveRoomEvent {
    eventType: string;
    roomId: string;
    status: string;
    customerId: string;
    customerName: string;
    updatedAt: string;
}

const TOPIC = '/topic/pharmacists/rooms/active';
const RECONNECT_DELAY_MS = 3000;

function hasAuthFailure(frame: { headers?: Record<string, string>; body?: string }): boolean {
    const message = `${frame.headers?.message ?? ''} ${frame.body ?? ''}`.toLowerCase();
    return message.includes('unauthorized')
        || message.includes('forbidden')
        || message.includes('missing authorization');
}

function extractBrokerError(frame: { headers?: Record<string, string>; body?: string }): string {
    return frame.headers?.message || frame.body || 'Unknown broker error';
}

function normalizeWsBaseUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
        return '';
    }

    if (['ws', 'wss', 'http', 'https'].includes(trimmed.toLowerCase())) {
        return '';
    }

    const withProtocol = /^(https?|wss?):\/\//.test(trimmed)
        ? trimmed
        : /^localhost(?::\d+)?$/i.test(trimmed) || /^[\w.-]+\.[a-z]{2,}(?::\d+)?$/i.test(trimmed)
            ? `http://${trimmed}`
            : '';
    if (!withProtocol) {
        return '';
    }

    try {
        const parsed = new URL(withProtocol);
        const protocol = parsed.protocol === 'https:' || parsed.protocol === 'wss:' ? 'wss:' : 'ws:';
        return `${protocol}//${parsed.host}`;
    } catch {
        return '';
    }
}

function toSockJsUrl(apiUrl?: string, wsUrl?: string): string {
    const explicitWsBase = normalizeWsBaseUrl(wsUrl ?? '');
    if (explicitWsBase) {
        return `${explicitWsBase.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')}/ws/chat`;
    }

    const apiWsBase = normalizeWsBaseUrl(apiUrl ?? '');
    if (apiWsBase) {
        return `${apiWsBase.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')}/ws/chat`;
    }

    return 'http://localhost:8081/ws/chat';
}

export function subscribeNewActiveRoom(onEvent: (event: ActiveRoomEvent) => void): () => void {
    const wsUrl = toSockJsUrl(import.meta.env.VITE_API_URL as string | undefined, import.meta.env.VITE_WS_URL as string | undefined);
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.warn('Skip active-room websocket subscription: missing access token');
        return () => undefined;
    }

    const client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: RECONNECT_DELAY_MS,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        debug: () => undefined,
    });

    let unsubscribe: (() => void) | null = null;

    client.onConnect = () => {
        const subscription = client.subscribe(TOPIC, (message: IMessage) => {
            try {
                const payload = JSON.parse(message.body) as ActiveRoomEvent;
                if (payload.eventType === 'NEW_ACTIVE_ROOM') {
                    onEvent(payload);
                }
            } catch {
                // Ignore malformed payload
            }
        });
        unsubscribe = () => subscription.unsubscribe();
    };

    client.onStompError = (frame) => {
        console.error('Active room websocket broker error:', { url: wsUrl, error: extractBrokerError(frame), frame });
        if (hasAuthFailure(frame)) {
            client.reconnectDelay = 0;
            void client.deactivate();
        }
    };

    client.onWebSocketError = (event) => {
        console.error('Active room websocket transport error:', { url: wsUrl, event });
    };

    client.activate();

    return () => {
        unsubscribe?.();
        client.deactivate();
    };
}
