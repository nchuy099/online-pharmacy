type SePayDisplayOrder = {
    id?: string | null;
    orderCode?: string | null;
    finalAmount?: number | null;
    paymentUrl?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
};

const DEFAULT_BANK_NAME = "MBBank";
const DEFAULT_BANK_ACCOUNT = "0123499999";

export const getOrderDisplayCode = (order: SePayDisplayOrder): string => {
    if (order.orderCode && order.orderCode.trim()) {
        return order.orderCode.trim();
    }

    return order.id ?? "";
};

export const getSePayQrUrl = (order: SePayDisplayOrder): string => {
    if (order.paymentUrl && order.paymentUrl.trim()) {
        return order.paymentUrl;
    }

    const orderCode = getOrderDisplayCode(order);
    const amount = order.finalAmount ?? 0;
    const bankName = order.bankName || DEFAULT_BANK_NAME;
    const bankAccount = order.bankAccount || DEFAULT_BANK_ACCOUNT;

    return `https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankName}&amount=${amount}&des=${orderCode}`;
};
