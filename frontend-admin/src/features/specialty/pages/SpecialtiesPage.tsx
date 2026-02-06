import { useState, useEffect, useCallback } from 'react';
import { SpecialtyTable, SpecialtyModal, SpecialtyHeader } from '../components';
import specialtyService from '../services';
import { CreateSpecialtyParams } from '../types/dto';
import { Specialty } from '../types/domain';
import { Pagination, SearchFilter } from '../../../shared/components/ui';

const SpecialtiesPage = () => {
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | undefined>(undefined);
    const [pagination, setPagination] = useState({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const fetchSpecialties = useCallback(async (page: number = 1, size: number = 10, searchParam?: string) => {
        setIsLoading(true);
        try {
            const data = await specialtyService.getList(page, size, searchParam);
            setSpecialties(data.specialties);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Fetch specialties error', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSpecialties(pagination.page, pagination.size, search);
    }, [fetchSpecialties, search, pagination.page, pagination.size]);

    const handlePageChange = (newPage: number) => {
        fetchSpecialties(newPage, pagination.size, search);
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedSpecialty(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (specialty: Specialty) => {
        setModalMode('edit');
        setSelectedSpecialty(specialty);
        setIsModalOpen(true);
    };

    const handleSave = async (payload: CreateSpecialtyParams) => {
        try {
            if (modalMode === 'create') {
                await specialtyService.create(payload);
            } else if (selectedSpecialty) {
                await specialtyService.update(selectedSpecialty.id, payload);
            }
            setIsModalOpen(false);
            fetchSpecialties(1, 10, search);
        } catch (error) {
            console.error('Save specialty error', error);
            alert('Có lỗi xảy ra khi lưu chuyên khoa');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa chuyên khoa này?')) {
            try {
                await specialtyService.remove(id);
                fetchSpecialties(1, 10, search);
            } catch (error) {
                console.error('Delete specialty error', error);
            }
        }
    };

    return (
        <div className="py-6 space-y-6">
            <SpecialtyHeader onAdd={handleOpenCreate} />

            <SearchFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm chuyên khoa theo tên hoặc mã..."
                onClear={() => setSearch('')}
                accentColor="indigo"
                className="border-indigo-50 focus-within:ring-indigo-100"
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        <SpecialtyTable
                            specialties={specialties}
                            onEdit={handleOpenEdit}
                            onDelete={handleDelete}
                        />
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            totalElements={pagination.totalElements}
                            pageSize={pagination.size}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>

            <SpecialtyModal
                isOpen={isModalOpen}
                mode={modalMode}
                initialData={selectedSpecialty}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
};

export default SpecialtiesPage;
