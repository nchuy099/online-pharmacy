import orderApi from '../api';
import { Order, OrderDetails, OrderStatus } from '../types/domain';
import { OrderResponse, OrderDetailsResponse } from '../types/dto';
import { Pagination } from '../../../shared/types/pagination';

const mapApiOrder = (item: OrderResponse): Order => ({
    id: item.id,
    orderCode: item.orderCode,
    paymentMethod: item.paymentMethod,
    items: item.items?.map((it) => ({ 
        id: it.id, 
        productName: it.productName, 
        productSlug: it.productSlug,
        quantity: it.quantity, 
        unitPrice: it.unitPrice 
    })),
    finalAmount: item.finalAmount,
    shippingFee: item.shippingFee,
    ghnServiceId: item.ghnServiceId,
    expectedDeliveryTime: item.expectedDeliveryTime,
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
    address: item.address ? {
        fullName: item.address.fullName,
        phoneNumber: item.address.phoneNumber,
        address: item.address.address,
        provinceName: item.address.provinceName,
        districtName: item.address.districtName,
        wardName: item.address.wardName,
        fullAddress: item.address.fullAddress,
    } : undefined,
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

const orderService = {
    async getList(page?: number, size?: number, search?: string, status?: string): Promise<{ orders: Order[]; pagination: Pagination }> {
        const res = await orderApi.getList(page ?? 1, size ?? 10, search, status);
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

    async confirmOrder(id: string): Promise<OrderDetails> {
        const res = await orderApi.confirmOrder(id);
        const data = (res.data as any) ?? (res as any).result;
        return mapApiOrderDetails(data);
    },

    async shipOrder(id: string): Promise<OrderDetails> {
        const res = await orderApi.shipOrder(id);
        const data = (res.data as any) ?? (res as any).result;
        return mapApiOrderDetails(data);
    },
};

export default orderService;
