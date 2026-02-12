import React from 'react';
import { PageHeader } from '../../../shared/components';

interface UsersHeaderProps {
    onAdd?: () => void;
    title?: string;
    subtitle?: string;
}

const UsersHeader = React.memo(({ 
    onAdd, 
    title = "Quản lý người dùng", 
    subtitle = "Quản lý và cấp quyền tài khoản trong hệ thống" 
}: UsersHeaderProps) => {
    return (
        <PageHeader
            title={title}
            description={subtitle}
            actionLabel={onAdd ? 'Thêm mới' : undefined}
            onAction={onAdd}
        />
    );
});

export default UsersHeader;
