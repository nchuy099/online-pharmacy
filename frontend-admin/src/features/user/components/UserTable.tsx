import React from 'react';
import { Column, Action, DataTable } from '../../../shared/components/ui';
import { User } from '../types/domain';
import RoleBadges from './RoleBadges';
import StatusBadge from './StatusBadge';

interface UserTableProps {
    users: User[];
    onView?: (user: User) => void;
}

const UserTable = React.memo(({ users, onView }: UserTableProps) => {
    // DataTable expects rows with `id` as string (per its generic constraint), so map ids to string
    const rows = users.map((u) => ({ ...u, id: String(u.id) }));

    const columns: Column<any>[] = [
        {
            key: 'fullName',
            header: 'Họ và tên',
            render: (_v, row) => row.fullName || row.name || '',
        },
        {
            key: 'dateOfBirth',
            header: 'Ngày sinh',
            render: (v: any) => (v ? new Date(v).toLocaleDateString('vi-VN') : '-'),
            width: '140px',
        },
        {
            key: 'gender',
            header: 'Giới tính',
            render: (v: any) => {
                if (!v) return '-';
                const g = (v as string).toUpperCase();
                if (g === 'MALE' || g === 'male') return 'Nam';
                if (g === 'FEMALE' || g === 'female') return 'Nữ';
                return 'Khác';
            },
            width: '100px',
        },
        { key: 'email', header: 'Email' },
        {
            key: 'phone',
            header: 'Số điện thoại',
            render: (_v, row) => row.phoneNumber || row.phone || '-',
            width: '150px',
        },
        {
            key: 'role',
            header: 'Vai trò',
            render: (_v, row) => <RoleBadges roles={row.roles} role={row.role} />,
            width: '180px',
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (_v, row) => <StatusBadge status={row.status} />,
            width: '120px',
        },
    ];

    const actions: Action<any>[] = [
        {
            label: 'Xem',
            onClick: (row) => onView?.(row as User),
            className: 'text-emerald-600 hover:text-emerald-900 p-1',
        },
    ];

    return <DataTable data={rows} columns={columns} actions={actions} />;
});

export default UserTable;
