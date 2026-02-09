import React from 'react';
import { PageHeader } from '../../../shared/components';

const OrderHeader = React.memo(() => {
    return (
        <PageHeader
            title="Quản lý đơn hàng"
            description="Danh sách đơn hàng"
        />
    );
});

export default OrderHeader;
