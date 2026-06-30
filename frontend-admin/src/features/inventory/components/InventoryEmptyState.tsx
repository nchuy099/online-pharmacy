import { Link } from 'react-router-dom';

interface InventoryEmptyStateProps {
    title: string;
    description: string;
    ctaLabel?: string;
    ctaTo?: string;
}

const InventoryEmptyState = ({ title, description, ctaLabel, ctaTo }: InventoryEmptyStateProps) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">{description}</p>
            {ctaLabel && ctaTo && (
                <Link
                    to={ctaTo}
                    className="inline-flex items-center mt-5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                    {ctaLabel}
                </Link>
            )}
        </div>
    );
};

export default InventoryEmptyState;
