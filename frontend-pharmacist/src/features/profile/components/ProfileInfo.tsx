import { FaBriefcase, FaEnvelope, FaMoneyBillWave, FaStar } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import type { PharmacistProfile } from '../types/domain';

interface ProfileInfoProps {
    profile: PharmacistProfile;
}

function SectionHeader({ icon: Icon, title }: { icon: IconType; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
            <Icon className="text-emerald-500 dark:text-emerald-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider text-xs">{title}</h3>
        </div>
    );
}

function InfoField({ label, value }: { label: string; value?: string | number | boolean }) {
    return (
        <div className="space-y-1">
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">{label}</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value ?? 'N/A'}</p>
        </div>
    );
}

export default function ProfileInfo({ profile }: ProfileInfoProps) {
    const formatCurrency = (amount?: number) => {
        if (typeof amount !== 'number') {
            return 'N/A';
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <SectionHeader icon={FaEnvelope} title="Personal Information" />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="Full Name" value={profile.fullName} />
                        <InfoField label="Email" value={profile.email} />
                        <InfoField label="Phone Number" value={profile.phoneNumber} />
                        <InfoField label="Created At" value={profile.createdAt ? new Date(profile.createdAt).toLocaleString() : 'N/A'} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <SectionHeader icon={FaBriefcase} title="Professional Details" />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="Specialty Code" value={profile.specialtyCode} />
                        <InfoField label="Specialty Name" value={profile.specialtyName} />
                        <InfoField label="Qualifications" value={profile.qualifications} />
                        <InfoField label="Experience" value={profile.experience} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <SectionHeader icon={FaBriefcase} title="Consultation Status" />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="Approval" value={profile.isApproved ? 'Approved' : 'Pending approval'} />
                        <InfoField label="Active Sessions" value={profile.activeSessions} />
                        <InfoField label="Total Consultations" value={profile.totalConsultations} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <SectionHeader icon={FaMoneyBillWave} title="Business Metrics" />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="Profit" value={formatCurrency(profile.profit)} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                    <SectionHeader icon={FaStar} title="Education & Rating" />
                    <div className="space-y-4">
                        <InfoField label="Rating" value={profile.rating ?? 'N/A'} />
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Education</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{profile.education || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
