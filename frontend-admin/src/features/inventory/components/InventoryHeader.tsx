import React from 'react';
import { PageHeader } from '../../../shared/components';

const InventoryHeader = React.memo(() => {
    return (
        <PageHeader
            title="Tổng tồn kho"
            description="Xem tồn tổng theo product variant và drill-down xuống từng lô hàng"
        />
    );
});

export default InventoryHeader;
