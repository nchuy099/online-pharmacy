

export interface FormField<T> {
    key: keyof T;
    label: string;
    type?: 'text' | 'textarea' | 'email' | 'number' | 'select' | 'multiselect' | 'password' | 'date' | 'checkbox';
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    options?: { label: string; value: any }[];
}

interface FormModalProps<T> {
    isOpen: boolean;
    mode: 'create' | 'edit';
    title?: string;
    titleCreate?: string;
    titleEdit?: string;
    fields: FormField<T>[];
    data: Partial<T>;
    onDataChange: (field: keyof T, value: any) => void;
    onClose: () => void;
    onSave: () => void;
    submitLabel?: string;
    submitLabelCreate?: string;
    submitLabelEdit?: string;
    cancelLabel?: string;
    submitButtonClassName?: string;
    cancelButtonClassName?: string;
    accentColor?: string; // e.g. 'emerald', 'indigo', 'amber'
}

const FormModal = <T extends Record<string, any>>({
    isOpen,
    mode,
    title,
    titleCreate,
    titleEdit,
    fields,
    data,
    onDataChange,
    onClose,
    onSave,
    submitLabel,
    submitLabelCreate,
    submitLabelEdit,
    cancelLabel = 'Hủy',
    accentColor = 'emerald',
    submitButtonClassName,
    cancelButtonClassName = 'px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-semibold text-sm',
}: FormModalProps<T>) => {
    const ringColor = `focus:ring-${accentColor}-500`;
    const focusBorder = `focus:border-${accentColor}-500`;
    const bgColor = `bg-${accentColor}-600`;
    const hoverBg = `hover:bg-${accentColor}-700`;
    const shadowColor = `shadow-${accentColor}-200`;

    const defaultSubmitBtn = `px-6 py-2 rounded-xl ${bgColor} ${hoverBg} text-white font-bold text-sm shadow-md ${shadowColor} transition-all active:scale-95`;
    const finalSubmitBtn = submitButtonClassName || defaultSubmitBtn;
    if (!isOpen) return null;

    const getTitle = () => {
        if (title) return title;
        return mode === 'create' ? titleCreate : titleEdit;
    };

    const getSubmitLabel = () => {
        if (submitLabel) return submitLabel;
        return mode === 'create' ? submitLabelCreate : submitLabelEdit;
    };

    const renderField = (field: FormField<T>) => {
        const value = data[field.key] ?? '';

        if (field.type === 'textarea') {
            return (
                <textarea
                    key={String(field.key)}
                    value={String(value)}
                    onChange={(e) => onDataChange(field.key, e.target.value)}
                    className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 ${ringColor} ${focusBorder} transition-all text-sm ${field.disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
                    placeholder={field.placeholder}
                    rows={field.rows || 4}
                    disabled={field.disabled}
                />
            );
        }

        if (field.type === 'select') {
            return (
                <select
                    key={String(field.key)}
                    value={String(value)}
                    onChange={(e) => onDataChange(field.key, e.target.value)}
                    className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 ${ringColor} ${focusBorder} transition-all text-sm bg-white ${field.disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
                    disabled={field.disabled}
                >
                    <option value="">-- Select --</option>
                    {field.options?.map((opt) => (
                        <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }

        if (field.type === 'multiselect') {
            const selected: any[] = Array.isArray(value) ? value : [];
            return (
                <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-auto">
                    {field.options?.map((opt) => (
                        <label key={String(opt.value)} className="flex items-center space-x-2 py-1">
                            <input
                                type="checkbox"
                                checked={selected.includes(opt.value)}
                                onChange={() => {
                                    const next = selected.includes(opt.value)
                                        ? selected.filter((v) => v !== opt.value)
                                        : [...selected, opt.value];
                                    onDataChange(field.key, next);
                                }}
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
            );
        }

        if (field.type === 'checkbox') {
            return (
                <input
                    key={String(field.key)}
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onDataChange(field.key, e.target.checked)}
                    className={`h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded ${field.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    disabled={field.disabled}
                />
            );
        }

        return (
            <input
                key={String(field.key)}
                type={field.type || 'text'}
                value={String(value)}
                onChange={(e) => onDataChange(field.key, e.target.value)}
                className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 ${ringColor} ${focusBorder} transition-all text-sm ${field.disabled ? 'bg-slate-50 cursor-not-allowed text-slate-400 font-bold border-slate-100' : ''}`}
                placeholder={field.placeholder}
                disabled={field.disabled}
            />
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 lg:p-8 animate-in fade-in zoom-in duration-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900">{getTitle()}</h2>
                    <p className="text-sm text-slate-500 mt-1">Vui lòng điền các thông tin cần thiết bên dưới.</p>
                </div>
                <div className="space-y-5 max-h-[60vh] overflow-y-auto px-1">
                    {fields.map((field) => (
                        <div key={String(field.key)}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                                {field.label}
                                {field.required && <span className="text-rose-500 ml-1">*</span>}
                            </label>
                            {renderField(field)}
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                    <button onClick={onClose} className={cancelButtonClassName}>
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onSave}
                        className={finalSubmitBtn}
                    >
                        {getSubmitLabel()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormModal;
