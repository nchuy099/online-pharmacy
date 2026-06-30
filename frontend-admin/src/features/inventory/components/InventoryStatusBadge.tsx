import { InventoryStockStatus } from '../types/domain';

interface InventoryStatusBadgeProps {
    status?: InventoryStockStatus;
}

const STATUS_STYLES: Record<InventoryStockStatus, { label: string; className: string }> = {
    IN_STOCK: {
        label: 'Còn hàng',
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    },
    OUT_OF_STOCK: {
        label: 'Hết hàng',
        className: 'bg-rose-100 text-rose-700 border border-rose-200',
    },
};

const InventoryStatusBadge = ({ status = 'IN_STOCK' }: InventoryStatusBadgeProps) => {
    const config = STATUS_STYLES[status];

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${config.className}`}>
            {config.label}
        </span>
    );
};

export default InventoryStatusBadge;
