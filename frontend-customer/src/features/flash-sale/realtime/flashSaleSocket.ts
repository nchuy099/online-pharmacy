import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const RECONNECT_DELAY_MS = 3000;

function normalizeWsBaseUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    if (!trimmed) return "";
    if (["ws", "wss", "http", "https"].includes(trimmed.toLowerCase())) return "";
    const withProtocol = /^(https?|wss?):\/\//.test(trimmed)
        ? trimmed
        : /^localhost(?::\d+)?$/i.test(trimmed) || /^[\w.-]+\.[a-z]{2,}(?::\d+)?$/i.test(trimmed)
            ? `http://${trimmed}`
            : "";
    if (!withProtocol) return "";
    try {
        const parsed = new URL(withProtocol);
        const protocol = parsed.protocol === "https:" || parsed.protocol === "wss:" ? "wss:" : "ws:";
        return `${protocol}//${parsed.host}`;
    } catch {
        return "";
    }
}

function toSockJsUrl(apiUrl?: string, wsUrl?: string): string {
    const explicitWsBase = normalizeWsBaseUrl(wsUrl ?? "");
    if (explicitWsBase) {
        return `${explicitWsBase.replace(/^ws:/, "http:").replace(/^wss:/, "https:")}/ws/chat`;
    }
    const apiWsBase = normalizeWsBaseUrl(apiUrl ?? "");
    if (apiWsBase) {
        return `${apiWsBase.replace(/^ws:/, "http:").replace(/^wss:/, "https:")}/ws/chat`;
    }
    return "http://localhost:8080/ws/chat";
}

export function subscribeFlashSaleItem(
    itemId: string,
    onMessage: (payload: { itemId: string; remainingStock: number; status: string; serverTime: string }) => void,
) {
    const wsUrl = toSockJsUrl(import.meta.env.VITE_API_URL as string | undefined, import.meta.env.VITE_WS_URL as string | undefined);
    const token = localStorage.getItem("accessToken");
    const client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: RECONNECT_DELAY_MS,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });

    client.onConnect = () => {
        client.subscribe(`/topic/flash-sales/items/${itemId}`, (message: IMessage) => {
            try {
                onMessage(JSON.parse(message.body));
            } catch {
                // ignore malformed realtime payloads
            }
        });
    };

    client.activate();
    return () => {
        void client.deactivate();
    };
}
