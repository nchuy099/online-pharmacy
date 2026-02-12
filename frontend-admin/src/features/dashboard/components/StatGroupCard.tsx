import React from 'react';

interface StatGroupCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

const StatGroupCard: React.FC<StatGroupCardProps> = ({ title, description, children, className = "" }) => {
    return (
        <div className={`mb-8 ${className}`}>
            <div className="mb-4 px-1">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
                {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {children}
            </div>
        </div>
    );
};

export default StatGroupCard;
