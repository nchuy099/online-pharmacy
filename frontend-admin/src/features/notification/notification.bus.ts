export type NotificationType = "success" | "warning" | "error" | "info";

export interface NotificationPayload {
    type: NotificationType;
    message: string;
    title?: string;
    duration?: number;
}

export interface Notification extends NotificationPayload {
    id: string;
}

type Listener = (notification: Notification) => void;

const DEFAULT_DURATION = 4000;

class NotificationBus {
    private listeners = new Set<Listener>();

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(payload: NotificationPayload) {
        const id = `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const notification: Notification = {
            id,
            duration: payload.duration ?? DEFAULT_DURATION,
            ...payload,
        };
        this.listeners.forEach((listener) => listener(notification));
        return id;
    }

    success(message: string, options?: Omit<NotificationPayload, "type" | "message">) {
        return this.notify({ type: "success", message, ...options });
    }

    warning(message: string, options?: Omit<NotificationPayload, "type" | "message">) {
        return this.notify({ type: "warning", message, ...options });
    }

    error(message: string, options?: Omit<NotificationPayload, "type" | "message">) {
        return this.notify({ type: "error", message, ...options });
    }

    info(message: string, options?: Omit<NotificationPayload, "type" | "message">) {
        return this.notify({ type: "info", message, ...options });
    }
}

export const notificationBus = new NotificationBus();
