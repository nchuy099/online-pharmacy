import { InventoryLotStatus } from '../types/domain';

interface InventoryLotStatusBadgeProps {
    status: InventoryLotStatus;
}

const STATUS_STYLES: Record<InventoryLotStatus, { label: string; className: string }> = {
    ACTIVE: {
        label: 'Đang bán',
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    },
    EXPIRING: {
        label: 'Sắp hết hạn',
        className: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
    EXPIRED: {
        label: 'Hết hạn',
        className: 'bg-rose-100 text-rose-700 border border-rose-200',
    },
    BLOCKED: {
        label: 'Đã chặn',
        className: 'bg-slate-200 text-slate-700 border border-slate-300',
    },
    DEPLETED: {
        label: 'Hết tồn',
        className: 'bg-slate-100 text-slate-500 border border-slate-200',
    },
};

const InventoryLotStatusBadge = ({ status }: InventoryLotStatusBadgeProps) => {
    const config = STATUS_STYLES[status];

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${config.className}`}>
            {config.label}
        </span>
    );
};

export default InventoryLotStatusBadge;
