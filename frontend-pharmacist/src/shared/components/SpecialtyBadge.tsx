import type { Specialty } from '../types/specialty';

interface SpecialtyBadgeProps {
    specialty: Specialty;
    className?: string;
}

const specialtyStyles: Record<Specialty, string> = {
    CARDIOLOGY: 'bg-teal-50 text-teal-700 border-teal-100',
    DIABETES: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    DERMATOLOGY: 'bg-pink-50 text-pink-700 border-pink-100',
    RESPIRATORY: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    DIGESTIVE: 'bg-orange-50 text-orange-700 border-orange-100',
    GENERAL_MEDICINE: 'bg-slate-50 text-slate-700 border-slate-100',
};

const specialtyLabels: Record<Specialty, string> = {
    CARDIOLOGY: 'Cardiology',
    DIABETES: 'Diabetes',
    DERMATOLOGY: 'Dermatology',
    RESPIRATORY: 'Respiratory',
    DIGESTIVE: 'Digestive',
    GENERAL_MEDICINE: 'General Medicine',
};

export default function SpecialtyBadge({ specialty, className = '' }: SpecialtyBadgeProps) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${specialtyStyles[specialty]} ${className}`}>
            {specialtyLabels[specialty]}
        </span>
    );
}
