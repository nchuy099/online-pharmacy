import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
    className = '', 
    variant = 'text', 
    width, 
    height 
}) => {
    const baseClass = "animate-pulse bg-slate-200";
    
    let variantClass = "";
    switch (variant) {
        case 'circle':
            variantClass = "rounded-full";
            break;
        case 'rect':
            variantClass = "rounded-md";
            break;
        case 'text':
        default:
            variantClass = "rounded h-4 mb-2 last:mb-0";
            break;
    }

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div 
            className={`${baseClass} ${variantClass} ${className}`} 
            style={style}
        />
    );
};

export default Skeleton;
