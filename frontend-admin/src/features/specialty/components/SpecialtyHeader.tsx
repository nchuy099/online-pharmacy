import React from 'react';
import { PageHeader } from '../../../shared/components';

interface SpecialtyHeaderProps {
    onAdd: () => void;
}

const SpecialtyHeader = React.memo(({ onAdd }: SpecialtyHeaderProps) => {
    return (
        <PageHeader
            title="Danh mục chuyên khoa"
            description="Quản lý các chuyên khoa khám bệnh từ xa"
            actionLabel="Thêm chuyên khoa"
            onAction={onAdd}
        />
    );
});

export default SpecialtyHeader;
