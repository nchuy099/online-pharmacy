import React from 'react';
import { PageHeader } from '../../../shared/components';

const PharmacistHeader = React.memo(() => {
    return (
        <PageHeader
            title="Quản lý dược sĩ"
            description="Danh sách tài khoản PHARMACIST và trạng thái duyệt tư vấn"
        />
    );
});

export default PharmacistHeader;
