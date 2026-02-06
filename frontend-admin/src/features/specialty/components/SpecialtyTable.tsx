import React from 'react';
import { DataTable, Column, Action } from '../../../shared/components/ui';
import { Specialty } from '../types/domain';

interface Props {
    specialties: Specialty[];
    onEdit: (specialty: Specialty) => void;
    onDelete: (id: string) => void;
}

const SpecialtyTable = React.memo(({ specialties, onEdit, onDelete }: Props) => {
    const columns: Column<Specialty>[] = [
        { key: 'code', header: 'Mã', width: '140px' },
        { key: 'name', header: 'Tên chuyên khoa' },
    ];

    const actions: Action<Specialty>[] = [
        {
            label: 'Sửa',
            onClick: (s) => onEdit(s),
            className: 'px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors',
        },
        {
            label: 'Xóa',
            onClick: (s) => onDelete(s.id),
            className: 'px-3 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors',
        },
    ];

    return (
        <DataTable<Specialty>
            data={specialties}
            columns={columns}
            actions={actions}
            emptyMessage="Chưa có chuyên khoa nào."
        />
    );
});

export default SpecialtyTable;
