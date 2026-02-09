import orderApi from './order.api';
import { Order, OrderDetails, OrderStatus } from './type/order';
import { OrderResponse, OrderDetailsResponse } from './type/order.dto';

const mapApiOrder = (item: OrderResponse): Order => ({
    id: item.id,
    orderCode: item.orderCode,
    paymentMethod: item.paymentMethod,
    items: item.items?.map((it) => ({ id: it.id, productName: it.productName, quantity: it.quantity, unitPrice: it.unitPrice })),
    finalAmount: item.finalAmount,
    note: item.note,
    status: (item.status || 'PENDING') as OrderStatus,
    totalItems: item.totalItems,
});

const mapApiOrderDetails = (item: OrderDetailsResponse): OrderDetails => ({
    ...mapApiOrder(item),
    payment: {
        method: item.payment.method,
        amount: item.payment.amount,
        status: item.payment.status,
    },
    shipment: item.shipment ? {
        orderCode: item.shipment.order_code,
        status: item.shipment.status,
        fromName: item.shipment.from_name,
        fromPhone: item.shipment.from_phone,
        fromAddress: item.shipment.from_address,
        toName: item.shipment.to_name,
        toPhone: item.shipment.to_phone,
        toAddress: item.shipment.to_address,
        weight: item.shipment.weight,
        leadtime: item.shipment.leadtime,
        log: item.shipment.log?.map(l => ({
            status: l.status,
            updatedDate: l.updated_date,
        })) || [],
    } : undefined,
});

import { Pagination } from '../../shared/types/pagination';

const orderService = {
    async getList(page?: number, size?: number): Promise<{ orders: Order[]; pagination: Pagination }> {
        const res = await orderApi.getList(page ?? 1, size ?? 10);
        const orders = (res.data as any)?.orders ?? (res as any).result?.orders ?? [];
        const pagination = (res.data as any)?.pagination ?? (res as any).result?.pagination ?? {
            page: 1,
            size: 10,
            totalPages: 0,
            totalElements: 0,
        };
        return {
            orders: Array.isArray(orders) ? orders.map(mapApiOrder) : [],
            pagination,
        };
    },

    async getDetails(id: string): Promise<OrderDetails> {
        const res = await orderApi.getDetails(id);
        const data = (res.data as any) ?? (res as any).result;
        return mapApiOrderDetails(data);
    },
};

export default orderService;
