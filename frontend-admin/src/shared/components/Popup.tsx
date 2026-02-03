import React from 'react';

export type PopupType = 'info' | 'warn' | 'error';

interface PopupProps {
    isOpen: boolean;
    type?: PopupType;
    title?: string;
    message: string;
    onClose: () => void;
    closeLabel?: string;
}

const typeConfig = {
    info: {
        bgColor: 'bg-emerald-50',
        titleColor: 'text-emerald-900',
        messageColor: 'text-emerald-700',
        buttonColor: 'bg-emerald-600 text-white hover:bg-emerald-700',
        borderColor: 'border-emerald-200',
    },
    warn: {
        bgColor: 'bg-amber-50',
        titleColor: 'text-amber-900',
        messageColor: 'text-amber-700',
        buttonColor: 'bg-amber-600 text-white hover:bg-amber-700',
        borderColor: 'border-amber-200',
    },
    error: {
        bgColor: 'bg-rose-50',
        titleColor: 'text-rose-900',
        messageColor: 'text-rose-700',
        buttonColor: 'bg-rose-600 text-white hover:bg-rose-700',
        borderColor: 'border-rose-200',
    },
};

const typeIcons = {
    info: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
    ),
    warn: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    ),
    error: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
    ),
};

const Popup: React.FC<PopupProps> = ({
    isOpen,
    type = 'info',
    title,
    message,
    onClose,
    closeLabel = 'Đóng',
}) => {
    if (!isOpen) return null;

    const config = typeConfig[type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className={`relative z-10 w-full max-w-sm rounded-lg shadow-lg p-6 ${config.bgColor} border ${config.borderColor}`}>
                <div className="flex items-start">
                    <div className={`flex-shrink-0 ${config.titleColor}`}>
                        {typeIcons[type]}
                    </div>
                    <div className="ml-3">
                        {title && (
                            <h3 className={`text-base font-semibold ${config.titleColor}`}>
                                {title}
                            </h3>
                        )}
                        <p className={`${title ? 'mt-2' : ''} text-sm ${config.messageColor} whitespace-pre-line`}>
                            {message}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-md ${config.buttonColor}`}
                    >
                        {closeLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Popup;
