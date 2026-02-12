const roleConfig: Record<string, { label: string; bg: string; text: string }> = {
    'SUPER_ADMIN': { label: 'Super Admin', bg: 'bg-indigo-100', text: 'text-indigo-700' },
    'PHARMACIST': { label: 'Dược sĩ', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    'STAFF': { label: 'Nhân viên', bg: 'bg-sky-100', text: 'text-sky-700' },
    'CUSTOMER': { label: 'Khách hàng', bg: 'bg-slate-100', text: 'text-slate-600' },
};

const RoleBadges = ({ roles, role }: { roles?: string[]; role?: string }) => {
    const roleList = roles || (role ? [role] : []);

    return (
        <div className="flex flex-wrap gap-1">
            {roleList.map((r) => {
                const config = roleConfig[r] || { label: r, bg: 'bg-gray-100', text: 'text-gray-600' };
                return (
                    <span
                        key={r}
                        className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg ${config.bg} ${config.text}`}
                    >
                        {config.label}
                    </span>
                );
            })}
        </div>
    );
};

export default RoleBadges;
