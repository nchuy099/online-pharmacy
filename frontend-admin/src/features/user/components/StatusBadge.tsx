interface StatusBadgeProps {
    status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hoạt động' },
        inactive: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Chưa kích hoạt' },
        suspended: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Bị khóa' },
        deleted: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Đã xóa' },
    };

    const defaultConfig = { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Không xác định' };
    const key = (status || '').toLowerCase();
    const config = statusConfig[key] || defaultConfig;

    return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;
