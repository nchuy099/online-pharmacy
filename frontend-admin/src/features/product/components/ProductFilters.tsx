import React from 'react';
import { useCategoryAll } from '../../category/hooks/useCategory';
import { SearchFilter, FilterConfig } from '../../../shared/components/ui';

interface ProductFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    categorySlug: string;
    onCategoryChange: (value: string) => void;
    minPrice?: number;
    onMinPriceChange: (value: number | undefined) => void;
    maxPrice?: number;
    onMaxPriceChange: (value: number | undefined) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = React.memo(({
    search,
    onSearchChange,
    categorySlug,
    onCategoryChange,
    minPrice,
    onMinPriceChange,
    maxPrice,
    onMaxPriceChange,
}) => {
    const { categories } = useCategoryAll();
    const [isCustomMode, setIsCustomMode] = React.useState(false);
    const [localMin, setLocalMin] = React.useState<number | undefined>(minPrice);
    const [localMax, setLocalMax] = React.useState<number | undefined>(maxPrice);

    // Sync local state with props (e.g. when cleared)
    React.useEffect(() => {
        setLocalMin(minPrice);
        setLocalMax(maxPrice);
        if (minPrice === undefined && maxPrice === undefined) {
            setIsCustomMode(false);
        }
    }, [minPrice, maxPrice]);

    // Handle debounced updates
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (localMin !== minPrice) onMinPriceChange(localMin);
            if (localMax !== maxPrice) onMaxPriceChange(localMax);
        }, 500);
        return () => clearTimeout(timer);
    }, [localMin, localMax, minPrice, maxPrice, onMinPriceChange, onMaxPriceChange]);

    // Helper to find parent path
    const getCategoryPath = (slug: string) => {
        const path: any[] = [];
        let current = categories.find(c => c.slug === slug);
        while (current) {
            path.unshift(current);
            current = categories.find(c => c.id === current?.parentId);
        }
        return path;
    };

    const activePath = getCategoryPath(categorySlug);

    // Dynamic filters based on levels
    const dynamicFilters: FilterConfig[] = [];

    // Level 1: Always show
    const level1Opts = categories.filter(c => !c.parentId);
    const selectedL1 = activePath[0]?.slug || 'all';

    dynamicFilters.push({
        key: 'category-l1',
        label: 'Danh mục cấp 1',
        value: selectedL1,
        onChange: (v) => onCategoryChange(v === 'all' ? '' : v),
        options: level1Opts.map(c => ({ label: c.name, value: c.slug! }))
    });

    // Level 2: Show if Level 1 is selected
    if (activePath[0]) {
        const level2Opts = categories.filter(c => c.parentId === activePath[0].id);
        if (level2Opts.length > 0) {
            const selectedL2 = activePath[1]?.slug || 'all';
            dynamicFilters.push({
                key: 'category-l2',
                label: 'Danh mục cấp 2',
                value: selectedL2,
                onChange: (v) => onCategoryChange(v === 'all' ? activePath[0].slug! : v),
                options: level2Opts.map(c => ({ label: c.name, value: c.slug! }))
            });
        }
    }

    // Level 3: Show if Level 2 is selected
    if (activePath[1]) {
        const level3Opts = categories.filter(c => c.parentId === activePath[1].id);
        if (level3Opts.length > 0) {
            const selectedL3 = activePath[2]?.slug || 'all';
            dynamicFilters.push({
                key: 'category-l3',
                label: 'Danh mục cấp 3',
                value: selectedL3,
                onChange: (v) => onCategoryChange(v === 'all' ? activePath[1].slug! : v),
                options: level3Opts.map(c => ({ label: c.name, value: c.slug! }))
            });
        }
    }

    const currentPriceRangeValue = (minPrice !== undefined || maxPrice !== undefined || isCustomMode)
        ? (minPrice === 0 && maxPrice === 100000 && !isCustomMode ? '0-100k' :
            minPrice === 100000 && maxPrice === 500000 && !isCustomMode ? '100k-500k' :
                minPrice === 500000 && maxPrice === undefined && !isCustomMode ? '500k+' : 'custom')
        : 'all';

    const onPriceRangeChange = (val: string) => {
        if (val === 'all') {
            setIsCustomMode(false);
            onMinPriceChange(undefined);
            onMaxPriceChange(undefined);
        } else if (val === '0-100k') {
            setIsCustomMode(false);
            onMinPriceChange(0);
            onMaxPriceChange(100000);
        } else if (val === '100k-500k') {
            setIsCustomMode(false);
            onMinPriceChange(100000);
            onMaxPriceChange(500000);
        } else if (val === '500k+') {
            setIsCustomMode(false);
            onMinPriceChange(500000);
            onMaxPriceChange(undefined);
        } else if (val === 'custom') {
            setIsCustomMode(true);
        }
    };

    return (
        <SearchFilter
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Tìm kiếm sản phẩm (tên, mã, SKU)..."
            filters={[]}
            className="border-slate-50 shadow-sm"
            accentColor="emerald"
            onClear={() => {
                onSearchChange('');
                onCategoryChange('');
                setIsCustomMode(false);
                onMinPriceChange(undefined);
                onMaxPriceChange(undefined);
            }}
        >
            {/* Price Filter Column - Fixed Cutoff Issue */}
            <div className="flex flex-col gap-1.5 w-full md:w-56 py-0.5 border-r border-slate-50 pr-3">
                <select
                    value={currentPriceRangeValue}
                    onChange={(e) => onPriceRangeChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all appearance-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.6rem center',
                        backgroundSize: '0.8rem'
                    }}
                >
                    <option value="all">Tất cả giá</option>
                    <option value="0-100k">Dưới 100k</option>
                    <option value="100k-500k">100k - 500k</option>
                    <option value="500k+">Trên 500k</option>
                    <option value="custom">Tùy chỉnh</option>
                </select>

                {(isCustomMode || currentPriceRangeValue === 'custom') && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                        <input
                            type="number"
                            placeholder="Từ..."
                            value={localMin ?? ''}
                            onChange={(e) => setLocalMin(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-300 outline-none transition-all placeholder:text-slate-400"
                        />
                        <input
                            type="number"
                            placeholder="Đến..."
                            value={localMax ?? ''}
                            onChange={(e) => setLocalMax(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-300 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                )}
            </div>

            {/* Vertical Hierarchical Categories Column - Balanced Width */}
            <div className="flex flex-col gap-1 w-full md:min-w-[220px] md:flex-1 py-0.5">
                {dynamicFilters.map((df) => (
                    <div key={df.key} className="relative group">
                        <select
                            value={df.value}
                            onChange={(e) => df.onChange(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-xl text-[12px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all appearance-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.6rem center',
                                backgroundSize: '0.8rem'
                            }}
                        >
                            <option value="all">-- {df.label} --</option>
                            {df.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </SearchFilter>
    );
});

export default ProductFilters;
