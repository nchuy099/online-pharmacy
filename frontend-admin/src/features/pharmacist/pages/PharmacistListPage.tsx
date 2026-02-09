import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import pharmacistService from '../services';
import { PharmacistResponse } from '../types/dto';
import { PharmacistTable, PharmacistHeader } from '../components';

import { Pagination, SearchFilter } from '../../../shared/components/ui';
import { Pagination as PaginationType } from '../../../shared/types/pagination';

const PharmacistListPage = () => {
    const navigate = useNavigate();
    const [pharmacists, setPharmacists] = useState<PharmacistResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<PaginationType>({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0,
    });
    const [stats, setStats] = useState({ approved: 0, pending: 0 });

    const fetchPharmacists = useCallback(async (
        page: number = 1,
        size: number = 10,
        searchParam?: string,
    ) => {
        setIsLoading(true);
        try {
            const data = await pharmacistService.getList(page, size, searchParam);
            setPharmacists(data.pharmacists);
            setPagination(data.pagination || {
                page,
                size,
                totalPages: 1,
                totalElements: data.pharmacists.length,
            });

            const approved = data.pharmacists.filter((p) => p.isApproved).length;
            setStats({ approved, pending: data.pharmacists.length - approved });
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPharmacists(pagination.page, pagination.size, search);
    }, [fetchPharmacists, pagination.page, pagination.size, search]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    return (
        <div className="py-6 space-y-6">
            <PharmacistHeader />

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Đã duyệt tư vấn', value: stats.approved, color: 'text-emerald-600' },
                    { label: 'Chưa duyệt tư vấn', value: stats.pending, color: 'text-amber-600' },
                    { label: 'Tổng dược sĩ', value: pagination.totalElements, color: 'text-indigo-600' },
                ].map((s) => (
                    <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
                        <p className={'text-3xl font-black ' + s.color}>{s.value}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <SearchFilter
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Tìm dược sĩ theo tên, email..."
                onClear={() => handleSearchChange('')}
                accentColor="indigo"
            />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center p-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <PharmacistTable
                        pharmacists={pharmacists}
                        onView={(pid) => navigate('/pharmacists/' + pid)}
                    />
                )}
            </div>

            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalElements={pagination.totalElements}
                pageSize={pagination.size}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default PharmacistListPage;
