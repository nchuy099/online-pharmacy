import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface RoomChatRealtimeMessage {
    id: string;
    chatRoomId?: string;
    senderId: string;
    senderType: string;
    content: string;
    type?: string;
    status?: string;
    createdAt: string;
}

const RECONNECT_DELAY_MS = 3000;
const PUBLISH_CONNECT_TIMEOUT_MS = 5000;

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

let publisherClient: Client | null = null;
let publisherConnected = false;
let publisherWaiters: Array<() => void> = [];
let publisherToken: string | null = null;
let publisherWsUrl: string | null = null;

function createPublisherClient(wsUrl: string, token: string | null): Client {
    const client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: RECONNECT_DELAY_MS,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        debug: () => undefined,
    });

    client.onConnect = () => {
        publisherConnected = true;
        const waiters = publisherWaiters;
        publisherWaiters = [];
        waiters.forEach((resolve) => resolve());
    };

    client.onDisconnect = () => {
        publisherConnected = false;
    };

    client.onWebSocketClose = () => {
        publisherConnected = false;
    };

    client.onStompError = (frame) => {
        console.error('Room publisher broker error:', { url: wsUrl, error: extractBrokerError(frame), frame });
        if (hasAuthFailure(frame)) {
            client.reconnectDelay = 0;
            void client.deactivate();
        }
    };

    client.onWebSocketError = (event) => {
        console.error('Room publisher transport error:', { url: wsUrl, event });
    };

    return client;
}

function resetPublisherClient(): void {
    if (publisherClient) {
        void publisherClient.deactivate();
    }
    publisherClient = null;
    publisherConnected = false;
    publisherWaiters = [];
    publisherToken = null;
    publisherWsUrl = null;
}

function ensurePublisherClient(wsUrl: string): Client {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        throw new Error('Missing access token for websocket publisher');
    }
    if (publisherClient && (publisherToken !== token || publisherWsUrl !== wsUrl)) {
        resetPublisherClient();
    }

    if (publisherClient) {
        return publisherClient;
    }

    publisherClient = createPublisherClient(wsUrl, token);
    publisherToken = token;
    publisherWsUrl = wsUrl;
    publisherClient.activate();
    return publisherClient;
}

async function waitForPublisherConnected(): Promise<void> {
    if (publisherConnected) {
        return;
    }

    await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            reject(new Error('Websocket publisher connect timeout'));
        }, PUBLISH_CONNECT_TIMEOUT_MS);

        publisherWaiters.push(() => {
            window.clearTimeout(timeoutId);
            resolve();
        });
    });
}

export async function publishPharmacistRoomMessage(
    roomId: string,
    payload: { content: string; type?: string },
): Promise<void> {
    const wsUrl = toSockJsUrl(import.meta.env.VITE_API_URL as string | undefined, import.meta.env.VITE_WS_URL as string | undefined);
    const client = ensurePublisherClient(wsUrl);

    if (!publisherConnected) {
        await waitForPublisherConnected();
    }

    client.publish({
        destination: `/app/chat.send/${roomId}`,
        body: JSON.stringify({
            content: payload.content,
            type: payload.type ?? 'TEXT',
            senderType: 'PHARMACIST',
        }),
    });
}

export function subscribeRoomMessages(
    roomId: string,
    onMessage: (message: RoomChatRealtimeMessage) => void,
): () => void {
    const wsUrl = toSockJsUrl(import.meta.env.VITE_API_URL as string | undefined, import.meta.env.VITE_WS_URL as string | undefined);
    const topic = `/topic/chat/${roomId}`;
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.warn('Skip room websocket subscription: missing access token', { roomId });
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
        const subscription = client.subscribe(topic, (message: IMessage) => {
            try {
                const payload = JSON.parse(message.body) as RoomChatRealtimeMessage;
                onMessage(payload);
            } catch {
                // Ignore malformed payload
            }
        });
        unsubscribe = () => subscription.unsubscribe();
    };

    client.onStompError = (frame) => {
        console.error('Room websocket broker error:', { url: wsUrl, roomId, error: extractBrokerError(frame), frame });
        if (hasAuthFailure(frame)) {
            client.reconnectDelay = 0;
            void client.deactivate();
        }
    };

    client.onWebSocketError = (event) => {
        console.error('Room websocket transport error:', { url: wsUrl, roomId, event });
    };

    client.activate();

    return () => {
        unsubscribe?.();
        client.deactivate();
    };
}
