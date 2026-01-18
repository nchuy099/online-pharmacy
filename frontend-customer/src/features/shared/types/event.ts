export type EventType = 'VIEW' | 'CLICK' | 'ADD_TO_CART' | 'CHECKOUT' | 'PURCHASE';

export const EventType = {
    VIEW: 'VIEW' as EventType,
    CLICK: 'CLICK' as EventType,
    ADD_TO_CART: 'ADD_TO_CART' as EventType,
    CHECKOUT: 'CHECKOUT' as EventType,
    PURCHASE: 'PURCHASE' as EventType
};

export interface CreateEventRequest {
    userId?: string | number;
    eventType: EventType;
    itemId?: string | number;
    sessionId?: string;
    metadata?: string;
}
