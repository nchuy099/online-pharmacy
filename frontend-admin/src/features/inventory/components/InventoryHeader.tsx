import React from 'react';
import { PageHeader } from '../../../shared/components';

const InventoryHeader = React.memo(() => {
    return (
        <PageHeader
            title="Quản lý kho hàng"
            description="Danh sách tồn kho sản phẩm"
        />
    );
});

export default InventoryHeader;
