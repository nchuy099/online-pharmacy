import React from 'react';
import { IconType } from 'react-icons';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: IconType;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    colorClass?: string; // e.g. 'text-indigo-600', 'bg-emerald-50'
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, subtitle, trend, colorClass = "text-indigo-600 bg-indigo-50" }) => {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon className="text-xl" />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${trend.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </div>
                )}
            </div>
            <div className="mt-auto">
                <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                <div className="text-2xl font-black text-slate-800">{value}</div>
                {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
            </div>
        </div>
    );
};

export default StatCard;
