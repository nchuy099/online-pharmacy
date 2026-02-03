import Skeleton from './Skeleton';

export interface Column<T> {
    key: keyof T;
    header: string;
    render?: (value: any, row: T) => React.ReactNode;
    width?: string;
}

export interface Action<T> {
    label: string;
    onClick: (row: T) => void;
    className?: string;
}

interface DataTableProps<T extends { id?: string | number | undefined }> {
    data: T[];
    columns: Column<T>[];
    actions?: Action<T>[];
    emptyMessage?: string;
    isLoading?: boolean;
    onRowClick?: (row: T) => void;
    selectedRowId?: string | number;
    rowClassName?: (row: T) => string;
}

const DataTable = <T extends { id?: string | number | undefined }>({
    data,
    columns,
    actions = [],
    emptyMessage = 'Chưa có dữ liệu nào.',
    isLoading = false,
    onRowClick,
    selectedRowId,
    rowClassName,
}: DataTableProps<T>) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-50">
                        <thead className="bg-slate-50">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={String(column.key)}
                                        className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                        style={{ width: column.width }}
                                    >
                                        {column.header}
                                    </th>
                                ))}
                                {actions.length > 0 && (
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Thao tác
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {[...Array(5)].map((_, idx) => (
                                <tr key={idx}>
                                    {columns.map((_, colIdx) => (
                                        <td key={colIdx} className="px-6 py-4">

                                            <Skeleton className="h-4 w-full" />
                                        </td>
                                    ))}
                                    {actions.length > 0 && (
                                        <td className="px-6 py-4">
                                            <Skeleton className="h-8 w-20 ml-auto" variant="rect" />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (data.length === 0) {

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-400 font-medium">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-50">
                    <thead className="bg-slate-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                    style={{ width: column.width }}
                                >
                                    {column.header}
                                </th>
                            ))}
                            {actions.length > 0 && (
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Thao tác
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {data.map((row) => (
                            <tr
                                key={String(row?.id)}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={`transition-colors duration-150 ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""} ${selectedRowId != null && String(selectedRowId) === String(row?.id) ? "bg-emerald-50/70 ring-1 ring-inset ring-emerald-200" : ""} ${rowClassName ? rowClassName(row) : ""}`}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={String(column.key)}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium"
                                        style={{ width: column.width }}
                                    >
                                        {column.render
                                            ? column.render(row[column.key], row)
                                            : String(row[column.key] ?? '')}
                                    </td>
                                ))}
                                {actions.length > 0 && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            {actions.map((action, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        action.onClick(row);
                                                    }}
                                                    className={
                                                        action.className ||
                                                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95'
                                                    }
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
