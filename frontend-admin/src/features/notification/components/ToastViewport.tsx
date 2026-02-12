import { useEffect, useRef, useState } from "react";
import { notificationBus, type Notification, type NotificationType } from "../notification.bus";

interface ToastItem extends Notification {
    createdAt: number;
    isVisible: boolean;
}

const styles: Record<NotificationType, { bg: string; text: string; border: string }> = {
    success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    error: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    info: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
};

const icons: Record<NotificationType, string> = {
    success: "✓",
    warning: "!",
    error: "✕",
    info: "i",
};

const EXIT_DURATION = 200;

const ToastViewport = () => {
    const [items, setItems] = useState<ToastItem[]>([]);
    const autoDismissMap = useRef<Map<string, number>>(new Map());
    const exitMap = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        const unsubscribe = notificationBus.subscribe((notification) => {
            const next: ToastItem = {
                ...notification,
                createdAt: Date.now(),
                isVisible: false,
            };

            setItems((prev) => [...prev, next]);

            const enterId = notification.id;
            window.setTimeout(() => {
                setItems((prev) =>
                    prev.map((item) => (item.id === enterId ? { ...item, isVisible: true } : item))
                );
            }, 10);

            if (notification.duration && notification.duration > 0) {
                const timeoutId = window.setTimeout(() => {
                    startDismiss(notification.id);
                }, notification.duration);
                autoDismissMap.current.set(notification.id, timeoutId);
            }
        });

        return () => {
            unsubscribe();
            autoDismissMap.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            autoDismissMap.current.clear();
            exitMap.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            exitMap.current.clear();
        };
    }, []);

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        const autoId = autoDismissMap.current.get(id);
        if (autoId) {
            window.clearTimeout(autoId);
            autoDismissMap.current.delete(id);
        }
        const exitId = exitMap.current.get(id);
        if (exitId) {
            window.clearTimeout(exitId);
            exitMap.current.delete(id);
        }
    };

    const startDismiss = (id: string) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, isVisible: false } : item))
        );
        if (!exitMap.current.has(id)) {
            const timeoutId = window.setTimeout(() => removeItem(id), EXIT_DURATION);
            exitMap.current.set(id, timeoutId);
        }
    };

    if (items.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[60] flex flex-col gap-3 w-full max-w-sm">
            {items.map((notification) => {
                const appearance = styles[notification.type];
                return (
                    <div
                        key={notification.id}
                        className={`border ${appearance.border} ${appearance.bg} ${appearance.text} rounded-lg shadow-sm px-4 py-3 flex items-start gap-3 transition-all duration-200 ease-out ${
                            notification.isVisible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
                        }`}
                    >
                        <div className="h-7 w-7 rounded-full border border-current flex items-center justify-center text-sm font-semibold">
                            {icons[notification.type]}
                        </div>
                        <div className="flex-1">
                            {notification.title && (
                                <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                            )}
                            <p className="text-sm text-gray-700">{notification.message}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => startDismiss(notification.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Dismiss notification"
                        >
                            ×
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ToastViewport;
