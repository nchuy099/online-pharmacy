import React from 'react';
import { Action, Column, DataTable } from '../../../shared/components/ui';
import { Category } from '../types/domain';

interface CategoryTableProps {
    categories: Category[];
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

const CategoryTable = React.memo(({ categories, onEdit, onDelete }: CategoryTableProps) => {
    const columns: Column<Category>[] = [
        {
            key: 'code',
            header: 'Mã',
            render: (value) => <div className="text-sm font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">{value}</div>,
        },
        {
            key: 'name',
            header: 'Tên danh mục',
            render: (value) => <div className="whitespace-pre-line text-sm text-gray-600">{value}</div>,
        },
        {
            key: 'parentName',
            header: 'Danh mục cha',
            render: (value) => <div className="text-sm text-gray-500">{value || '-'}</div>,
        },
        {
            key: 'level',
            header: 'Cấp độ',
            render: (value) => <div className="text-sm font-medium">{value}</div>,
        },
        {
            key: 'isActive',
            header: 'Trạng thái',
            render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {value ? 'Hoạt động' : 'Ẩn'}
                </span>
            ),
        },
    ];

    const actions: Action<Category>[] = [
        {
            label: 'Edit',
            onClick: (category) => onEdit(category),
            className: 'px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100',
        },
        {
            label: 'Delete',
            onClick: (category) => onDelete(category),
            className: 'px-3 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100',
        },
    ];

    return (
        <DataTable
            data={categories}
            columns={columns}
            actions={actions}
            emptyMessage="Chưa có danh mục nào."
        />
    );
});

export default CategoryTable;
