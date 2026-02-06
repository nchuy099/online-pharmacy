import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components';

interface ProductDetailsHeaderProps {
    onDelete?: () => void;
    isDeleting?: boolean;
}

const ProductDetailsHeader: React.FC<ProductDetailsHeaderProps> = ({ onDelete, isDeleting }) => {

    const navigate = useNavigate();

    return (
        <PageHeader
            title="Chi tiết sản phẩm"
            description="Xem và chỉnh sửa thông tin sản phẩm"
            onBack={() => navigate(-1)}
            secondaryActionLabel={onDelete ? (isDeleting ? 'Đang xóa...' : 'Xóa sản phẩm') : undefined}
            onSecondaryAction={onDelete}
            secondaryActionClassName="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100 hover:bg-red-100 disabled:opacity-50"
        />
    );
};

export default ProductDetailsHeader;
