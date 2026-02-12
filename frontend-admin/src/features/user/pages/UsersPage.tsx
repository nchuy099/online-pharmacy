import { useUserList } from "../hooks/useUser";
import {
    UsersFilters,
    UsersHeader,
    UserTable,
    AddAdminModal
} from "../components";
import { Pagination } from "../../../shared/components/ui";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const UsersPage = () => {
    const navigate = useNavigate();
    const {
        users,
        isLoading,
        error,
        refresh,
        pagination,
        search,
        setSearch,
        status,
        setStatus,
        role,
        setRole,
    } = useUserList();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePageChange = (newPage: number) => {
        refresh(newPage, pagination.size, search, status, role);
    };

    const startIndex = (pagination.page - 1) * pagination.size;
    const endIndex = Math.min(startIndex + pagination.size, pagination.totalElements);

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
    );
    if (error) return <div className="text-red-600 p-4 bg-red-50 rounded-xl">{error.message}</div>;

    return (
        <div className="space-y-6">
            <UsersHeader onAdd={() => setIsModalOpen(true)} />

            <UsersFilters
                searchQuery={search}
                statusFilter={status}
                roleFilter={role}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                onRoleChange={setRole}
                summaryText={`Hiển thị ${startIndex + 1}-${endIndex} trong tổng số ${pagination.totalElements} người dùng`}
            />

            <UserTable
                users={users}
                onView={(user) => navigate(`/users/${user.id}`)}
            />

            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalElements={pagination.totalElements}
                pageSize={pagination.size}
                onPageChange={handlePageChange}
            />

            <AddAdminModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={() => {
                    setIsModalOpen(false);
                    refresh();
                }}
            />
        </div>
    );
};

export default UsersPage;
