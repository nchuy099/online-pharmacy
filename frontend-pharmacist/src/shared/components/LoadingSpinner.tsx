import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    text?: string;
}

export default function LoadingSpinner({
    size = 'md',
    color = 'emerald-600',
    text
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-10 h-10 border-4',
        lg: 'w-16 h-16 border-4',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <motion.div
                className={`${sizeClasses[size]} border-${color}/20 border-t-${color} rounded-full`}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
            {text && (
                <p className="text-sm font-medium text-gray-500 animate-pulse">{text}</p>
            )}
        </div>
    );
}
