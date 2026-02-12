import clsx from 'clsx';
export type AppointmentStatus = 'SCHEDULED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface StatusBadgeProps {
    status: AppointmentStatus;
    size?: 'sm' | 'md';
}

const statusStyles: Record<AppointmentStatus, string> = {
    SCHEDULED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
    WAITING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700 animate-pulse',
    IN_PROGRESS: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
    COMPLETED: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
};

const statusLabels: Record<AppointmentStatus, string> = {
    SCHEDULED: 'Scheduled',
    WAITING: 'Waiting',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full font-bold border border-transparent uppercase tracking-wider',
                size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
                statusStyles[status]
            )}
        >
            {statusLabels[status]}
        </span>
    );
}
