import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import { authApi } from '../api/auth.api';
import { resolveApiErrorMessage } from '../../../shared/api/apiError';

const NOT_APPROVED_MSG = 'Bạn chưa đủ điều kiện tư vấn, vui lòng liên hệ quản trị viên để được cấp phép.';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { accessToken, refreshToken, user } = await authService.login({
                identifier: email,
                password,
            });

            const profile = await authApi.getPharmacistProfile(accessToken);
            if (profile.isApproved === false) {
                setError(NOT_APPROVED_MSG);
                navigate('/forbidden?reason=not-approved', { replace: true });
                return;
            }

            await login(accessToken, refreshToken, { ...user, isApproved: true });
            navigate('/chat-dashboard');
        } catch (err: any) {
            setError(resolveApiErrorMessage(err, 'Invalid credentials or server error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Pharmacist Portal</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Enter email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition-colors font-medium disabled:bg-emerald-400"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
