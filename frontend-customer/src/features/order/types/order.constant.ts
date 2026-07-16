// ORDER_STATUS
export const ORDER_STATUS = {
    PENDING: "PENDING",
    PENDING_PAYMENT: "PENDING_PAYMENT",
    PROCESSING: "PROCESSING",
    SHIPPING: "SHIPPING",
    DELIVERED: "DELIVERED",
    RETURN_REQUESTED: "RETURN_REQUESTED",
    RETURNED: "RETURNED",
    CANCELLED: "CANCELLED"
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

// ORDER_MODE
export const ORDER_MODE = {
    BUY_NOW: "BUY_NOW",
    CART: "CART",
} as const

export type OrderMode = typeof ORDER_MODE[keyof typeof ORDER_MODE]

// PAYMENT_STATUS
export const PAYMENT_STATUS = {
    INITIATED: "INITIATED",
    PROCESSING: "PROCESSING",
    PARTIAL: "PARTIAL",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED"
} as const

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]

// PAYMENT_METHOD
export const PAYMENT_METHOD = {
    COD: "COD",
    VN_PAY: "VNPAY",
    BANK_TRANSFER: "BANK_TRANSFER"
} as const


export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD]
