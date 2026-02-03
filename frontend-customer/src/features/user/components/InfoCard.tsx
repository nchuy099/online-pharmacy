import React from "react";

interface InfoCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:border-emerald-200 transition-colors group">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                {label}
            </p>
            <p className="text-gray-900 font-semibold">{value}</p>
        </div>
    </div>
);
