import React from 'react';
import { PageHeader } from '../../../shared/components';

interface CategoryHeaderProps {
    onAdd: () => void;
}

const CategoryHeader = React.memo(({ onAdd }: CategoryHeaderProps) => {
    return (
        <PageHeader
            title="Quản lý danh mục thuốc"
            description="Thêm, sửa, xóa danh mục sản phẩm"
            actionLabel="Thêm danh mục"
            onAction={onAdd}
        />
    );
});

export default CategoryHeader;
