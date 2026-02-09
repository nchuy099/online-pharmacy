import React from 'react';
import { DataTable, Column, Action } from '../../../shared/components/ui';
import { PharmacistResponse, getSpecialistName } from '../types/dto';

interface Props {
    pharmacists: PharmacistResponse[];
    onView: (id: string) => void;
}

const PharmacistTable = React.memo(({ pharmacists, onView }: Props) => {
    const columns: Column<PharmacistResponse>[] = [
        { key: 'fullName', header: 'Họ tên' },
        { key: 'email', header: 'Email' },
        { key: 'phoneNumber', header: 'Số điện thoại' },
        {
            key: 'specialtyCode',
            header: 'Chuyên khoa',
            render: (_value, row) => (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                    {getSpecialistName(row.specialtyCode, row.specialtyName)}
                </span>
            ),
        },
        {
            key: 'isApproved',
            header: 'Duyệt tư vấn',
            render: (_value, row) => (
                <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        row.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                >
                    {row.isApproved ? 'Đã duyệt' : 'Chưa duyệt'}
                </span>
            ),
        },
        { key: 'experience', header: 'Kinh nghiệm' },
    ];

    const actions: Action<PharmacistResponse>[] = [
        {
            label: 'Chi tiết',
            onClick: (p) => onView(p.id),
            className: 'px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all font-bold text-xs',
        },
    ];

    return (
        <DataTable<PharmacistResponse>
            data={pharmacists}
            columns={columns}
            actions={actions}
            emptyMessage="Chưa có tài khoản dược sĩ trong hệ thống."
        />
    );
});

export default PharmacistTable;
