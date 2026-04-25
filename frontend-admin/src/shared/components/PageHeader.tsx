import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';

interface PageHeaderProps {
    title: React.ReactNode;
    description?: string;
    actionLabel?: React.ReactNode;
    onAction?: () => void;
    secondaryActionLabel?: React.ReactNode;
    onSecondaryAction?: () => void;
    onBack?: () => void;
    actionClassName?: string;
    secondaryActionClassName?: string;
}

const PageHeader: React.FC<PageHeaderProps> = React.memo(({
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
    onBack,
    actionClassName = 'inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700',
    secondaryActionClassName = 'inline-flex items-center px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100 hover:bg-red-100',
}) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <FaArrowLeft size={14} />
                    </button>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {description && <p className="text-gray-600 mt-1">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {secondaryActionLabel && onSecondaryAction && (
                    <button onClick={onSecondaryAction} className={secondaryActionClassName}>
                        {secondaryActionLabel}
                    </button>
                )}
                {actionLabel && onAction && (
                    <button onClick={onAction} className={actionClassName}>
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
});

export default PageHeader;
