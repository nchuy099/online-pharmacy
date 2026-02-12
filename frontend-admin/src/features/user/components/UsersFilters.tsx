import React from 'react';
import { FaDownload } from 'react-icons/fa';
import { SearchFilter, FilterConfig } from '../../../shared/components/ui';

interface UsersFiltersProps {
    searchQuery: string;
    statusFilter: string;
    roleFilter: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onRoleChange: (value: string) => void;
    summaryText: string;
    onExport?: () => void;
    excludeRoles?: string[];
}

const UsersFilters = React.memo(({
    searchQuery,
    statusFilter,
    roleFilter,
    onSearchChange,
    onStatusChange,
    onRoleChange,
    summaryText,
    onExport,
    excludeRoles = [],
}: UsersFiltersProps) => {
    const roleOptions = [
        { label: 'Khách hàng', value: 'CUSTOMER' },
        { label: 'Super Admin', value: 'SUPER_ADMIN' },
        { label: 'Dược sĩ', value: 'PHARMACIST' },
        { label: 'Nhân viên', value: 'STAFF' },
    ].filter(option => !excludeRoles.includes(option.value));

    const filters: FilterConfig[] = [
        {
            key: 'role',
            label: 'Tất cả vai trò',
            value: roleFilter,
            onChange: onRoleChange,
            options: roleOptions
        },
        {
            key: 'status',
            label: 'Tất cả trạng thái',
            value: statusFilter,
            onChange: onStatusChange,
            options: [
                { label: 'Hoạt động', value: 'ACTIVE' },
                { label: 'Chưa kích hoạt', value: 'INACTIVE' },
                { label: 'Bị khóa', value: 'SUSPENDED' },
                { label: 'Đã xóa', value: 'DELETED' },
            ]
        }
    ];

    return (
        <div className="space-y-4">
            <SearchFilter
                search={searchQuery}
                onSearchChange={onSearchChange}
                searchPlaceholder="Tìm người dùng theo tên, email, SĐT..."
                filters={filters}
                onClear={() => {
                    onSearchChange('');
                    onStatusChange('all');
                    onRoleChange('all');
                }}
                accentColor="indigo"
            />

            <div className="flex items-center justify-between px-2">
                <div className="text-xs font-medium text-slate-500 italic">{summaryText}</div>
                {onExport && (
                    <button
                        onClick={onExport}
                        className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
                    >
                        <FaDownload className="mr-2 text-indigo-500" />
                        Xuất Excel
                    </button>
                )}
            </div>
        </div>
    );
});

export default UsersFilters;
