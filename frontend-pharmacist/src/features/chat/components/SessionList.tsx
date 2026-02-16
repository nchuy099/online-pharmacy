import { useState, useMemo } from 'react';
import { FaSearch, FaFilter, FaCircle } from 'react-icons/fa';
import type { ChatSession, SessionStatus } from '../types/domain';

interface Props {
    sessions: ChatSession[];
    selectedId: string | null;
    onSelect: (session: ChatSession) => void;
    onAccept: (session: ChatSession) => void;
}

const statusConfig: Record<SessionStatus, { color: string; label: string; priority: number }> = {
    WAITING: { color: 'text-yellow-500', label: 'Chờ', priority: 0 },
    ACTIVE: { color: 'text-green-500', label: 'Đang chat', priority: 1 },
    CLOSED: { color: 'text-gray-400', label: 'Đã kết thúc', priority: 2 },
};

function getTimeDiff(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ`;
    return new Date(isoDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function SessionList({ sessions, selectedId, onSelect, onAccept }: Props) {
    const [filter, setFilter] = useState<SessionStatus | 'ALL'>('ALL');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        let list = [...sessions];
        if (filter !== 'ALL') list = list.filter(s => s.status === filter);
        if (search.trim()) list = list.filter(s => s.customerName.toLowerCase().includes(search.toLowerCase()));
        // Sort: WAITING first (long wait = top), then ACTIVE, then CLOSED
        list.sort((a, b) => {
            const pa = statusConfig[a.status].priority;
            const pb = statusConfig[b.status].priority;
            if (pa !== pb) return pa - pb;
            return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        });
        return list;
    }, [sessions, filter, search]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3">
                <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">
                    Phiên tư vấn
                </h2>

                {/* Filter */}
                <div className="flex items-center gap-2">
                    <FaFilter className="text-gray-400 text-[10px]" />
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value as any)}
                        className="flex-1 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="WAITING">Đang chờ</option>
                        <option value="ACTIVE">Đang chat</option>
                        <option value="CLOSED">Đã kết thúc</option>
                    </select>
                </div>

                {/* Search */}
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm khách hàng..."
                        className="w-full text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 font-medium text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-xs text-gray-400 font-medium">
                        Không có phiên nào
                    </div>
                ) : (
                    filtered.map(session => {
                        const isSelected = session.id === selectedId;
                        const cfg = statusConfig[session.status];
                        const isUrgent = session.status === 'WAITING' && (Date.now() - new Date(session.startedAt).getTime()) > 10 * 60000;

                        return (
                            <div key={session.id} className="relative group/item">
                                <button
                                    onClick={() => onSelect(session)}
                                    className={`w-full text-left p-4 border-b border-gray-50 dark:border-gray-700/50 transition-all hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <FaCircle className={`text-[6px] ${isUrgent ? 'text-red-500 animate-pulse' : cfg.color}`} />
                                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {session.customerName}
                                            </span>
                                        </div>
                                        {session.unreadCount > 0 ? (
                                            <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full px-1">
                                                {session.unreadCount}
                                            </span>
                                        ) : session.status === 'WAITING' ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAccept(session);
                                                }}
                                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded-lg transition-all shadow-sm active:scale-95"
                                            >
                                                NHẬN
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isUrgent ? 'text-red-500' : cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {getTimeDiff(session.startedAt)}
                                        </span>
                                    </div>
                                    {session.specialty && (
                                        <span className="inline-block mt-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                            {session.specialty}
                                        </span>
                                    )}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
