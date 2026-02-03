import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useDebounce } from '../../../shared/hooks';

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
}
interface SearchFilterProps {
    search: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    filters?: FilterConfig[];
    onClear?: () => void;
    className?: string;
    accentColor?: string; // 'emerald', 'indigo', 'amber', etc.
    children?: React.ReactNode;
}

const SearchFilter: React.FC<SearchFilterProps> = React.memo(({
    search,
    onSearchChange,
    searchPlaceholder = "Tìm kiếm...",
    filters = [],
    onClear,
    className = "",
    accentColor = "indigo",
    children
}) => {
    // Local state for immediate input feedback
    const [inputValue, setInputValue] = useState(search);
    const debouncedValue = useDebounce(inputValue, 500);

    // Sync internal state when external search prop changes (e.g. onClear)
    useEffect(() => {
        setInputValue(search);
    }, [search]);

    // Only notify parent when debounced value changes
    useEffect(() => {
        if (debouncedValue !== search) {
            onSearchChange(debouncedValue);
        }
    }, [debouncedValue, onSearchChange, search]);

    const focusRing = `focus:ring-${accentColor}-300`;
    const hoverText = `hover:text-${accentColor}-600`;

    return (
        <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm p-3 flex flex-col md:flex-row gap-3 items-center ${className}`}>
            {/* Search Input - Expands to fill available space */}
            <div className="relative flex-1 w-full min-w-0">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={searchPlaceholder}
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 ${focusRing} transition-all placeholder:text-slate-400`}
                />
                {inputValue && (
                    <button
                        onClick={() => {
                            setInputValue('');
                            onSearchChange('');
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <FaTimes className="text-[10px]" />
                    </button>
                )}
            </div>

            {/* Custom Children and Filters - Compact layout */}
            <div className="flex flex-col md:flex-row gap-2 items-center">
                {filters.map((filter) => (
                    <div key={filter.key} className="w-full md:w-48">
                        <select
                            value={filter.value}
                            onChange={(e) => filter.onChange(e.target.value)}
                            className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 ${focusRing} transition-all appearance-none`}
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                backgroundSize: '0.9rem'
                            }}
                        >
                            <option value="all">{filter.label}</option>
                            {filter.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
                {children}
            </div>

            {/* Clear Button */}
            {onClear && (
                <button
                    onClick={onClear}
                    className={`text-[13px] font-bold text-slate-400 ${hoverText} transition-colors px-4 border-l border-slate-100 whitespace-nowrap hidden md:block`}
                >
                    Xóa lọc
                </button>
            )}
        </div>
    );
});

export default SearchFilter;
