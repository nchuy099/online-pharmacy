import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import { User } from '../types/domain';
import userService from '../services';
import CustomerDetailPage from './CustomerDetailPage';
import AdminDetailPage from './AdminDetailPage';

const UserDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await userService.getDetails(id);
            setUser(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch user details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [id]);

    const handleBack = () => {
        navigate('/users');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Lỗi! </strong>
                <span className="block sm:inline">{error || 'Không tìm thấy người dùng'}</span>
            </div>
        );
    }

    const isCustomer = user.role === 'CUSTOMER';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleBack}
                    className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <FaArrowLeft className="text-slate-600" />
                </button>
                <nav className="flex text-sm font-medium">
                    <ol className="flex items-center space-x-2">
                        <li>
                            <button onClick={handleBack} className="text-slate-500 hover:text-emerald-600 transition-colors">Tài khoản</button>
                        </li>
                        <li>
                            <FaChevronRight className="text-slate-300 text-xs" />
                        </li>
                        <li className="text-slate-900">Chi tiết tài khoản</li>
                    </ol>
                </nav>
            </div>

            {isCustomer ? (
                <CustomerDetailPage user={user} onRefresh={fetchUser} />
            ) : (
                <AdminDetailPage user={user} onRefresh={fetchUser} />
            )}
        </div>
    );
};

export default UserDetailPage;
