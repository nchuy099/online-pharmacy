import assert from "node:assert/strict";

import { getOrderDisplayCode, getSePayQrUrl } from "../../src/features/order/utils/paymentDisplay.ts";

const sampleOrder = {
    id: "9f7c7d8a-1111-2222-3333-abcdef123456",
    orderCode: "ORD260524ABCD1234",
    finalAmount: 125000,
    paymentUrl: "https://qr.sepay.vn/img?acc=999&bank=MBBank&amount=125000&des=ORD260524ABCD1234",
};

assert.equal(
    getOrderDisplayCode(sampleOrder),
    "ORD260524ABCD1234",
    "display code should always prefer orderCode over derived id fragments",
);

assert.equal(
    getSePayQrUrl(sampleOrder),
    sampleOrder.paymentUrl,
    "QR should use backend-provided paymentUrl when available",
);

assert.equal(
    getSePayQrUrl({
        ...sampleOrder,
        paymentUrl: null,
        bankAccount: "0123499999",
        bankName: "MBBank",
    }),
    "https://qr.sepay.vn/img?acc=0123499999&bank=MBBank&amount=125000&des=ORD260524ABCD1234",
    "QR fallback should be built from orderCode, amount, bank account and bank name",
);
