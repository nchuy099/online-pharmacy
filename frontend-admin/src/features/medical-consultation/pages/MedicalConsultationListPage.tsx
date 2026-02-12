import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaRobot, FaRegClock, FaClipboardList } from 'react-icons/fa';
import medicalConsultationService from '../services';
import { MedicalConsultationListItem, MedicalConsultationSummary } from '../types/dto';
import { DataTable, Pagination, SearchFilter, Column, FilterConfig } from '../../../shared/components/ui';
import { Pagination as PaginationType } from '../../../shared/types';

const EMPTY_STATS: MedicalConsultationSummary = {
    total: 0,
    active: 0,
    closed: 0,
    unassigned: 0,
};

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
};

const statusConfig: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Đang mở', className: 'bg-emerald-100 text-emerald-700' },
    CLOSED: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-700' },
    WAITING: { label: 'Chờ xử lý', className: 'bg-amber-100 text-amber-700' },
};

const typeConfig: Record<string, { label: string; className: string }> = {
    PHARMACIST: { label: 'Dược sĩ', className: 'bg-indigo-100 text-indigo-700' },
    AI: { label: 'AI', className: 'bg-cyan-100 text-cyan-700' },
};

const MedicalConsultationListPage = () => {
    const navigate = useNavigate();
    const [consultations, setConsultations] = useState<MedicalConsultationListItem[]>([]);
    const [stats, setStats] = useState<MedicalConsultationSummary>(EMPTY_STATS);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [assignedFilter, setAssignedFilter] = useState('all');
    const [specialtyFilter, setSpecialtyFilter] = useState('all');
    const [pagination, setPagination] = useState<PaginationType>({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0,
    });

    const fetchConsultations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await medicalConsultationService.getList({
                page: pagination.page,
                size: pagination.size,
                search: search || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
                type: typeFilter === 'all' ? undefined : typeFilter,
                specialty: specialtyFilter === 'all' ? undefined : specialtyFilter,
                assigned: assignedFilter === 'all' ? undefined : assignedFilter === 'assigned',
            });
            setConsultations(response.consultations || []);
            setStats(response.stats || EMPTY_STATS);
            setPagination((prev) => {
                const next = response.pagination || prev;
                if (
                    prev.page === next.page &&
                    prev.size === next.size &&
                    prev.totalPages === next.totalPages &&
                    prev.totalElements === next.totalElements
                ) {
                    return prev;
                }
                return next;
            });
        } catch (error) {
            console.error(error);
            setConsultations([]);
            setStats(EMPTY_STATS);
        } finally {
            setIsLoading(false);
        }
    }, [assignedFilter, pagination.page, pagination.size, search, specialtyFilter, statusFilter, typeFilter]);

    useEffect(() => {
        fetchConsultations();
    }, [fetchConsultations]);

    const specialtyOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const consultation of consultations) {
            if (!consultation.specialtyCode) continue;
            map.set(consultation.specialtyCode, consultation.specialtyName || consultation.specialtyCode);
        }
        return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
    }, [consultations]);

    const filters: FilterConfig[] = [
        {
            key: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: (value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
            },
            options: [
                { label: 'Đang mở', value: 'ACTIVE' },
                { label: 'Đã đóng', value: 'CLOSED' },
                { label: 'Chờ xử lý', value: 'WAITING' },
            ],
        },
        {
            key: 'type',
            label: 'Loại tư vấn',
            value: typeFilter,
            onChange: (value) => {
                setTypeFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
            },
            options: [
                { label: 'Dược sĩ', value: 'PHARMACIST' },
                { label: 'AI', value: 'AI' },
            ],
        },
        {
            key: 'assigned',
            label: 'Phân công',
            value: assignedFilter,
            onChange: (value) => {
                setAssignedFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
            },
            options: [
                { label: 'Đã gán dược sĩ', value: 'assigned' },
                { label: 'Chưa gán dược sĩ', value: 'unassigned' },
            ],
        },
        {
            key: 'specialty',
            label: 'Chuyên khoa',
            value: specialtyFilter,
            onChange: (value) => {
                setSpecialtyFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
            },
            options: specialtyOptions,
        },
    ];

    const columns: Column<MedicalConsultationListItem>[] = [
        {
            key: 'status',
            header: 'Trạng thái',
            width: '140px',
            render: (_value, row) => {
                const config = statusConfig[row.status] || { label: row.status, className: 'bg-slate-100 text-slate-700' };
                return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${config.className}`}>{config.label}</span>;
            },
        },
        {
            key: 'customerName',
            header: 'Bệnh nhân',
            render: (_value, row) => (
                <div>
                    <p className="font-semibold text-slate-800">{row.customerName}</p>
                    <p className="text-xs text-slate-400">{row.title}</p>
                </div>
            ),
        },
        {
            key: 'pharmacistName',
            header: 'Dược sĩ',
            render: (_value, row) => row.pharmacistName || <span className="text-slate-400">Chưa gán</span>,
        },
        {
            key: 'specialtyCode',
            header: 'Chuyên khoa',
            render: (_value, row) => row.specialtyName || row.specialtyCode || <span className="text-slate-400">-</span>,
        },
        {
            key: 'type',
            header: 'Loại',
            width: '120px',
            render: (_value, row) => {
                const config = typeConfig[row.type] || { label: row.type, className: 'bg-slate-100 text-slate-700' };
                return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${config.className}`}>{config.label}</span>;
            },
        },
        {
            key: 'createdAt',
            header: 'Tạo lúc',
            width: '150px',
            render: (value) => formatDateTime(value),
        },
        {
            key: 'updatedAt',
            header: 'Cập nhật cuối',
            width: '150px',
            render: (value) => formatDateTime(value),
        },
    ];

    return (
        <div className="space-y-6 py-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-500">Medical Consultation</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Tư vấn y tế</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                        Theo dõi các phiên tư vấn theo trạng thái, người tham gia và chuyên khoa mà không hiển thị nội dung hội thoại.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Tổng số phiên', value: stats.total, icon: FaClipboardList, className: 'text-slate-700 bg-slate-100' },
                    { label: 'Đang mở', value: stats.active, icon: FaRegClock, className: 'text-emerald-700 bg-emerald-100' },
                    { label: 'Đã đóng', value: stats.closed, icon: FaRobot, className: 'text-slate-700 bg-slate-100' },
                    { label: 'Chưa gán dược sĩ', value: stats.unassigned, icon: FaUserMd, className: 'text-amber-700 bg-amber-100' },
                ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                                <p className="mt-3 text-3xl font-black text-slate-900">{item.value}</p>
                            </div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.className}`}>
                                <item.icon />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <SearchFilter
                search={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                searchPlaceholder="Tìm theo bệnh nhân hoặc dược sĩ..."
                filters={filters}
                onClear={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setAssignedFilter('all');
                    setSpecialtyFilter('all');
                    setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                accentColor="emerald"
            />

            <DataTable
                data={consultations}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Chưa có phiên tư vấn nào."
                onRowClick={(row) => navigate(`/medical-consultations/${row.id}`)}
            />

            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalElements={pagination.totalElements}
                pageSize={pagination.size}
                onPageChange={(nextPage) => setPagination((prev) => ({ ...prev, page: nextPage }))}
            />
        </div>
    );
};

export default MedicalConsultationListPage;
