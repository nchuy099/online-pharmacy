import {
    FaArrowDown,
    FaArrowUp,
    FaCalendarAlt,
    FaEllipsisH,
    FaFilter
} from 'react-icons/fa';
import { useEffect, useMemo, useState } from 'react';
import { ReactNode } from 'react';
import { AnalyticsQuickPreset, AnalyticsTimeType, useDashboardStats } from '../hooks/useDashboardStats';

const TIME_TYPES: { id: AnalyticsTimeType; label: string }[] = [
    { id: 'day', label: 'Ngày' },
    { id: 'month', label: 'Tháng' },
    { id: 'year', label: 'Năm' },
    { id: 'range', label: 'Khoảng thời gian' }
];

const QUICK_PRESET_LABELS: Record<AnalyticsQuickPreset, string> = {
    today: 'Hôm nay',
    thisMonth: 'Tháng này',
    thisYear: 'Năm nay',
    custom: 'Tùy chỉnh'
};

const fmtCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const fmtNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.round(value));
const fmtAxisCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(0)}K`;
    }
    return `${Math.round(value)}đ`;
};
const parseIsoDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
};
const addDays = (date: Date, amount: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
};
const addMonths = (yearMonth: string, amount: number) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + amount);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const fmtIsoDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
const shortDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};
const shortMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    return `${month}/${year}`;
};

const MetricCard = ({
    title,
    value,
    subtitle,
    trend
}: {
    title: string;
    value: ReactNode;
    subtitle?: string;
    trend?: number;
}) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
        <p className="mt-2 text-2xl font-black text-slate-800">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        {typeof trend === 'number' && (
            <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend >= 0 ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(trend).toFixed(1)}% so với kỳ trước
            </p>
        )}
    </div>
);

type ChartTab = 'business' | 'orders' | 'users' | 'products' | 'consultations';

const DashboardPage = () => {
    const {
        timeType,
        setTimeType,
        dataSource,
        setDataSource,
        quickPreset,
        setQuickPreset,
        selectedDate,
        setSelectedDate,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        rangeFrom,
        setRangeFrom,
        rangeTo,
        setRangeTo,
        applyRangePreset,
        applyCustomFilters,
        hasPendingCustomChanges,
        activeRange,
        kpiComparison,
        scopeKpi,
        trend,
        topProducts,
        isLoading,
        error
    } = useDashboardStats();

    const [topTab, setTopTab] = useState<'best-selling' | 'most-viewed' | 'most-cart' | 'highest-revenue' | 'highest-profit'>('best-selling');
    const [rangeMode, setRangeMode] = useState<'last7d' | 'last30d' | 'last6m' | 'last12m' | 'custom'>('last7d');
    const [isDataSourceMenuOpen, setIsDataSourceMenuOpen] = useState(false);
    const [chartTab, setChartTab] = useState<ChartTab>('business');

    const visibleQuickPresets = useMemo<AnalyticsQuickPreset[]>(() => {
        if (timeType === 'day') {
            return ['today', 'custom'];
        }
        if (timeType === 'month') {
            return ['thisMonth', 'custom'];
        }
        if (timeType === 'year') {
            return ['thisYear', 'custom'];
        }
        return ['custom'];
    }, [timeType]);

    useEffect(() => {
        if (timeType === 'range' && quickPreset !== 'custom') {
            setQuickPreset('custom');
        }
    }, [quickPreset, setQuickPreset, timeType]);

    const visibleTopProducts = useMemo(() => {
        const rows = [...topProducts];
        switch (topTab) {
            case 'most-viewed':
                return rows.sort((a, b) => b.views - a.views);
            case 'most-cart':
                return rows.sort((a, b) => b.addToCart - a.addToCart);
            case 'highest-revenue':
                return rows.sort((a, b) => b.revenue - a.revenue);
            case 'highest-profit':
                return rows.sort((a, b) => b.profit - a.profit);
            default:
                return rows.sort((a, b) => b.purchases - a.purchases);
        }
    }, [topProducts, topTab]);

    const topMetricRenderer = useMemo(() => {
        if (topTab === 'most-viewed') {
            return (item: (typeof topProducts)[number]) => `${fmtNumber(item.views)} lượt xem`;
        }
        if (topTab === 'most-cart') {
            return (item: (typeof topProducts)[number]) => `${fmtNumber(item.addToCart)} lượt thêm giỏ`;
        }
        if (topTab === 'highest-revenue') {
            return (item: (typeof topProducts)[number]) => fmtCurrency(item.revenue);
        }
        if (topTab === 'highest-profit') {
            return (item: (typeof topProducts)[number]) => fmtCurrency(item.profit);
        }
        return (item: (typeof topProducts)[number]) => `${fmtNumber(item.purchases)} lượt bán`;
    }, [topTab]);

    const chartRangeLabel = useMemo(() => {
        if (timeType === 'day') {
            const end = parseIsoDate(selectedDate);
            const start = addDays(end, -6);
            return `${shortDate(fmtIsoDate(start))} - ${shortDate(fmtIsoDate(end))}`;
        }
        if (timeType === 'month') {
            const startMonth = addMonths(selectedMonth, -5);
            return `${shortMonth(startMonth)} - ${shortMonth(selectedMonth)}`;
        }
        if (timeType === 'year') {
            const startYear = selectedYear - 4;
            return `${startYear} - ${selectedYear}`;
        }
        return `${shortDate(rangeFrom)} - ${shortDate(rangeTo)}`;
    }, [rangeFrom, rangeTo, selectedDate, selectedMonth, selectedYear, timeType]);

    const chartPeriodLabel = useMemo(() => {
        if (timeType === 'month') {
            return `trong ${trend.length} tháng`;
        }
        if (timeType === 'year') {
            return `trong ${trend.length} năm`;
        }
        return `trong ${trend.length} ngày`;
    }, [timeType, trend.length]);

    const chartTitle = useMemo(() => {
        if (chartTab === 'orders') return 'Biểu đồ xu hướng đơn hàng';
        if (chartTab === 'users') return 'Biểu đồ xu hướng người dùng mới';
        if (chartTab === 'products') return 'Biểu đồ xu hướng sản phẩm';
        if (chartTab === 'consultations') return 'Biểu đồ xu hướng tư vấn';
        return 'Biểu đồ xu hướng doanh thu và lợi nhuận';
    }, [chartTab]);
    const purchasingUserPerOrderRatio = useMemo(() => {
        if (!scopeKpi || scopeKpi.orders <= 0) {
            return 0.45;
        }
        return Math.min(1, Math.max(0, scopeKpi.purchasingUsers / scopeKpi.orders));
    }, [scopeKpi]);
    const productSeries = useMemo(() => {
        const activeProducts = scopeKpi?.activeProducts ?? 0;
        const soldProductsInScope = scopeKpi?.soldProducts ?? 0;
        const totalOrdersInTrend = Math.max(1, trend.reduce((sum, item) => sum + item.orders, 0));
        return trend.map((point, idx) => {
            const totalProducts = Math.max(
                1,
                Math.round(activeProducts * (0.94 + ((idx % 5) * 0.015)))
            );
            const soldProducts = Math.min(
                totalProducts,
                Math.max(0, Math.round((soldProductsInScope * point.orders) / totalOrdersInTrend))
            );
            return { totalProducts, soldProducts };
        });
    }, [scopeKpi?.activeProducts, scopeKpi?.soldProducts, trend]);

    const maxBusinessValue = useMemo(() => {
        if (chartTab === 'orders') {
            return Math.max(...trend.map((item) => item.orders), 0);
        }
        if (chartTab === 'users') {
            return Math.max(
                ...trend.flatMap((item) => [item.newUsers, Math.round(item.orders * purchasingUserPerOrderRatio)]),
                0
            );
        }
        if (chartTab === 'products') {
            return Math.max(...productSeries.flatMap((item) => [item.totalProducts, item.soldProducts]), 0);
        }
        if (chartTab === 'consultations') {
            return Math.max(...trend.flatMap((item) => [item.chatbotConsultations, item.pharmacistConsultations]), 0);
        }
        return Math.max(...trend.flatMap((item) => [item.revenue, item.profit]), 0);
    }, [chartTab, productSeries, purchasingUserPerOrderRatio, trend]);

    const yAxisScale = useMemo(() => {
        const steps = 4;
        const rawMax = Math.max(maxBusinessValue, 0);
        if (rawMax === 0) {
            const ticks = Array.from({ length: steps + 1 }, (_, idx) => ({
                value: steps - idx,
                label: chartTab === 'business' ? (steps - idx === 0 ? '0đ' : `${steps - idx}đ`) : String(steps - idx)
            }));
            return { max: steps, ticks };
        }
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
        const normalized = rawMax / magnitude;
        const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
        const niceMax = niceNormalized * magnitude;
        const stepValue = niceMax / steps;

        const ticks = Array.from({ length: steps + 1 }, (_, idx) => {
            const value = stepValue * (steps - idx);
            return {
                value,
                label: chartTab === 'business' ? fmtAxisCurrency(value) : fmtNumber(value)
            };
        });
        return { max: niceMax, ticks };
    }, [chartTab, maxBusinessValue]);

    const yAxisUnitLabel = chartTab === 'business' ? '(VNĐ)' : '(Số lượng)';
    const completedOrderRatio = useMemo(() => {
        if (!scopeKpi || scopeKpi.orders <= 0) {
            return 0.78;
        }
        return Math.min(1, Math.max(0, scopeKpi.orderCompleted / scopeKpi.orders));
    }, [scopeKpi]);

    const chartMinWidth = useMemo(() => {
        const yAxisWidth = 120;
        const minBarWidth = 44;
        if (trend.length <= 12) {
            return 0;
        }
        return yAxisWidth + trend.length * minBarWidth;
    }, [trend.length]);
    const useVerticalXAxisLabels = trend.length >= 20;

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
            </div>
        );
    }

    if (error || !scopeKpi) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                <h3 className="text-lg font-bold">Lỗi tải dữ liệu</h3>
                <p>{error?.message || 'Không thể lấy dữ liệu analytics.'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Analytics Dashboard</h1>
                        <div className="relative">
                            <button
                                type="button"
                                aria-label="Mở tùy chọn dữ liệu"
                                onClick={() => setIsDataSourceMenuOpen((prev) => !prev)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50">
                                <FaEllipsisH className="text-xs" />
                            </button>
                            {isDataSourceMenuOpen && (
                                <div className="absolute right-0 z-20 mt-1 w-28 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDataSource('real');
                                            setIsDataSourceMenuOpen(false);
                                        }}
                                        className={`block w-full rounded px-2 py-1 text-left text-xs font-semibold ${
                                            dataSource === 'real' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                                        }`}>
                                        Real
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDataSource('mock');
                                            setIsDataSourceMenuOpen(false);
                                        }}
                                        className={`block w-full rounded px-2 py-1 text-left text-xs font-semibold ${
                                            dataSource === 'mock' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                                        }`}>
                                        Mock
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="mt-2 text-slate-500">Theo dõi doanh thu, lợi nhuận, đơn hàng và người dùng theo phạm vi thời gian đã chọn</p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-lg font-bold text-slate-800 shadow-sm">
                        <FaCalendarAlt className="text-slate-500" />
                        Phạm vi: {activeRange.label}
                    </div>
                </div>

                <div className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm lg:w-fit">
                    <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <FaFilter />
                        </span>

                        <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                {TIME_TYPES.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setTimeType(item.id)}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                            timeType === item.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}>
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {timeType !== 'range' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {visibleQuickPresets.map((presetId) => (
                                        <button
                                            key={presetId}
                                            onClick={() => setQuickPreset(presetId)}
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                quickPreset === presetId ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}>
                                            {QUICK_PRESET_LABELS[presetId]}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {timeType === 'range' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setRangeMode('last7d');
                                            applyRangePreset('last7d');
                                        }}
                                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                                            rangeMode === 'last7d' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}>
                                        7 ngày qua
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRangeMode('last30d');
                                            applyRangePreset('last30d');
                                        }}
                                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                                            rangeMode === 'last30d' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}>
                                        30 ngày qua
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRangeMode('last6m');
                                            applyRangePreset('last6m');
                                        }}
                                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                                            rangeMode === 'last6m' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}>
                                        6 tháng qua
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRangeMode('last12m');
                                            applyRangePreset('last12m');
                                        }}
                                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                                            rangeMode === 'last12m' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}>
                                        12 tháng qua
                                    </button>
                                    <button
                                        onClick={() => setRangeMode('custom')}
                                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                                            rangeMode === 'custom' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}>
                                        Tùy chỉnh
                                    </button>
                                </div>
                            )}

                            {quickPreset === 'custom' && timeType !== 'range' && (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-500">Tùy chỉnh:</span>
                                        {timeType === 'day' && (
                                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm" />
                                        )}
                                        {timeType === 'month' && (
                                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm" />
                                        )}
                                        {timeType === 'year' && (
                                            <input type="number" min={2020} max={2099} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm" />
                                        )}
                                        <button
                                            onClick={applyCustomFilters}
                                            disabled={!hasPendingCustomChanges}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                                                hasPendingCustomChanges ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'cursor-not-allowed bg-slate-200 text-slate-500'
                                            }`}>
                                            Áp dụng
                                        </button>
                                    </div>
                                </>
                            )}

                            {timeType === 'range' && rangeMode !== 'custom' && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={applyCustomFilters}
                                            disabled={!hasPendingCustomChanges}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                                                hasPendingCustomChanges ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'cursor-not-allowed bg-slate-200 text-slate-500'
                                            }`}>
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>
                            )}

                            {timeType === 'range' && rangeMode === 'custom' && (
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm" />
                                        <span className="text-slate-400">→</span>
                                        <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm" />
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[11px] font-semibold text-slate-500">Tối đa 30 ngày</span>
                                        <button
                                            onClick={applyCustomFilters}
                                            disabled={!hasPendingCustomChanges}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                                                hasPendingCustomChanges ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'cursor-not-allowed bg-slate-200 text-slate-500'
                                            }`}>
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-bold text-slate-700">Hiệu quả kinh doanh</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <MetricCard title="Doanh thu trong kỳ" value={fmtCurrency(scopeKpi.revenue)} trend={kpiComparison.revenue} />
                        <MetricCard title="Lợi nhuận trong kỳ" value={fmtCurrency(scopeKpi.profit)} trend={kpiComparison.profit} />
                        <MetricCard title="Biên lợi nhuận" value={`${scopeKpi.marginPercent.toFixed(1)}%`} subtitle="Lợi nhuận / Doanh thu" trend={kpiComparison.marginPercent} />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-bold text-slate-700">Đơn hàng</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <MetricCard
                            title="Tổng đơn hàng"
                            value={fmtNumber(scopeKpi.orders)}
                            trend={kpiComparison.orders}
                            subtitle={`Hoàn thành ${fmtNumber(scopeKpi.orderCompleted)}`}
                        />
                        <MetricCard title="Giá trị trung bình đơn" value={fmtCurrency(scopeKpi.aov)} subtitle="AOV" trend={kpiComparison.aov} />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-bold text-slate-700">Sản phẩm & tư vấn</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <MetricCard
                            title="Sản phẩm được bán"
                            value={
                                <span className="inline-flex items-baseline gap-1 leading-tight">
                                    <span>{fmtNumber(scopeKpi.soldProducts)}</span>
                                    <span className="text-base font-semibold text-slate-500">/{fmtNumber(scopeKpi.activeProducts)}</span>
                                </span>
                            }
                            subtitle="Được bán / Tổng sản phẩm"
                            trend={kpiComparison.soldProducts}
                        />
                        <MetricCard
                            title="Số tư vấn"
                            value={fmtNumber(scopeKpi.consultations)}
                            subtitle={`Chatbot ${fmtNumber(scopeKpi.chatbotConsultations)} • Dược sĩ ${fmtNumber(scopeKpi.pharmacistConsultations)}`}
                            trend={kpiComparison.consultations}
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-bold text-slate-700">Người dùng</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <MetricCard title="Tổng số người dùng" value={fmtNumber(scopeKpi.totalUsers)} subtitle="Đến thời điểm hiện tại" trend={kpiComparison.totalUsers} />
                        <MetricCard title="Người dùng mới" value={fmtNumber(scopeKpi.newUsers)} trend={kpiComparison.newUsers} />
                        <MetricCard title="Người dùng chốt đơn" value={fmtNumber(scopeKpi.purchasingUsers)} subtitle="Có đơn hàng thành công trong kỳ" trend={kpiComparison.purchasingUsers} />
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-10">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-slate-800">
                            {chartTitle} {chartPeriodLabel}
                            <span className="mt-0.5 block text-base font-semibold text-slate-600">({chartRangeLabel})</span>
                        </h2>
                        <div className="flex rounded-xl bg-slate-100 p-1">
                            <button
                                onClick={() => setChartTab('business')}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${chartTab === 'business' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                Kinh doanh
                            </button>
                            <button
                                onClick={() => setChartTab('orders')}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${chartTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                Đơn hàng
                            </button>
                            <button
                                onClick={() => setChartTab('users')}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${chartTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                Người dùng
                            </button>
                            <button
                                onClick={() => setChartTab('products')}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${chartTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                Sản phẩm
                            </button>
                            <button
                                onClick={() => setChartTab('consultations')}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${chartTab === 'consultations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                Tư vấn
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div style={chartMinWidth > 0 ? { minWidth: `${chartMinWidth}px` } : undefined}>
                            <div className="flex gap-3">
                                <div className="flex h-60 w-24 flex-col">
                                    <p className="mb-2 text-[11px] font-bold text-slate-600">{yAxisUnitLabel}</p>
                                    <div className="flex flex-1 flex-col justify-between">
                                        {yAxisScale.ticks.map((tick) => (
                                            <div key={tick.value} className="text-[11px] font-semibold text-slate-500">
                                                {tick.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className="relative grid h-60 flex-1 gap-2"
                                    style={{ gridTemplateColumns: `repeat(${Math.max(trend.length, 1)}, minmax(0, 1fr))` }}>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                                        {yAxisScale.ticks.map((tick, idx) => (
                                            <div key={`${tick.value}-${idx}`} className="border-t border-slate-200" />
                                        ))}
                                    </div>

                                    {trend.map((point, idx) => {
                                        if (chartTab === 'orders') {
                                            const completedOrders = Math.min(point.orders, Math.round(point.orders * completedOrderRatio));
                                            const barHeight = `${(point.orders / yAxisScale.max) * 100}%`;
                                            const completedBarHeight = `${(completedOrders / yAxisScale.max) * 100}%`;
                                            return (
                                                <div key={point.label} className="relative z-10 flex min-w-0 items-end">
                                                    <div className="relative flex h-full w-full items-end rounded-md bg-slate-100 px-1.5">
                                                        <div
                                                            className="relative w-full rounded-sm bg-indigo-200 transition-opacity hover:opacity-85"
                                                            style={{ height: barHeight }}
                                                            title={`${point.label} • Tổng: ${fmtNumber(point.orders)} • Hoàn thành: ${fmtNumber(completedOrders)}`}>
                                                            <div
                                                                className="absolute bottom-0 left-0 w-full rounded-sm bg-indigo-500"
                                                                style={{ height: completedBarHeight }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (chartTab === 'users') {
                                            const purchasingUsers = Math.round(point.orders * purchasingUserPerOrderRatio);
                                            const newUsersHeight = `${(point.newUsers / yAxisScale.max) * 100}%`;
                                            const purchasingUsersHeight = `${(purchasingUsers / yAxisScale.max) * 100}%`;
                                            return (
                                                <div key={point.label} className="relative z-10 flex min-w-0 items-end">
                                                    <div className="relative flex h-full w-full items-end gap-1 rounded-md bg-slate-100 px-1.5">
                                                        <div
                                                            className="w-full rounded-sm bg-amber-500 transition-opacity hover:opacity-85"
                                                            style={{ height: newUsersHeight }}
                                                            title={`${point.label} • Người dùng mới: ${fmtNumber(point.newUsers)}`}
                                                        />
                                                        <div
                                                            className="w-full rounded-sm bg-teal-500 transition-opacity hover:opacity-85"
                                                            style={{ height: purchasingUsersHeight }}
                                                            title={`${point.label} • Người dùng chốt đơn: ${fmtNumber(purchasingUsers)}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (chartTab === 'products') {
                                            const productPoint = productSeries[idx] || { totalProducts: 0, soldProducts: 0 };
                                            const totalBarHeight = `${(productPoint.totalProducts / yAxisScale.max) * 100}%`;
                                            const soldBarHeight = `${(productPoint.soldProducts / yAxisScale.max) * 100}%`;
                                            return (
                                                <div key={point.label} className="relative z-10 flex min-w-0 items-end">
                                                    <div className="relative flex h-full w-full items-end rounded-md bg-slate-100 px-1.5">
                                                        <div
                                                            className="relative w-full rounded-sm bg-emerald-200 transition-opacity hover:opacity-85"
                                                            style={{ height: totalBarHeight }}
                                                            title={`${point.label} • Tổng: ${fmtNumber(productPoint.totalProducts)} • Được bán: ${fmtNumber(productPoint.soldProducts)}`}>
                                                            <div
                                                                className="absolute bottom-0 left-0 w-full rounded-sm bg-emerald-500"
                                                                style={{ height: soldBarHeight }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (chartTab === 'consultations') {
                                            const chatbotHeight = `${(point.chatbotConsultations / yAxisScale.max) * 100}%`;
                                            const pharmacistHeight = `${(point.pharmacistConsultations / yAxisScale.max) * 100}%`;
                                            return (
                                                <div key={point.label} className="relative z-10 flex min-w-0 items-end">
                                                    <div className="relative flex h-full w-full items-end gap-1 rounded-md bg-slate-100 px-1.5">
                                                        <div
                                                            className="w-full rounded-sm bg-cyan-500 transition-opacity hover:opacity-85"
                                                            style={{ height: chatbotHeight }}
                                                            title={`${point.label} • Chatbot: ${fmtNumber(point.chatbotConsultations)}`}
                                                        />
                                                        <div
                                                            className="w-full rounded-sm bg-violet-500 transition-opacity hover:opacity-85"
                                                            style={{ height: pharmacistHeight }}
                                                            title={`${point.label} • Dược sĩ: ${fmtNumber(point.pharmacistConsultations)}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const revenueHeight = `${(point.revenue / yAxisScale.max) * 100}%`;
                                        const profitHeight = `${(point.profit / yAxisScale.max) * 100}%`;
                                        return (
                                            <div key={point.label} className="relative z-10 flex min-w-0 items-end">
                                                <div className="relative flex h-full w-full items-end gap-1 rounded-md bg-slate-100 px-1.5">
                                                    <div
                                                        className="w-full rounded-sm bg-emerald-500 transition-opacity hover:opacity-85"
                                                        style={{ height: revenueHeight }}
                                                        title={`${point.label} • Doanh thu: ${fmtCurrency(point.revenue)}`}
                                                    />
                                                    <div
                                                        className="w-full rounded-sm bg-sky-500 transition-opacity hover:opacity-85"
                                                        style={{ height: profitHeight }}
                                                        title={`${point.label} • Lợi nhuận: ${fmtCurrency(point.profit)}`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-2 flex gap-3">
                                <div className="w-24" />
                                <div
                                    className="grid flex-1 gap-2"
                                    style={{ gridTemplateColumns: `repeat(${Math.max(trend.length, 1)}, minmax(0, 1fr))` }}>
                                    {trend.map((point) => (
                                        <div key={`${point.label}-x`} className={useVerticalXAxisLabels ? 'flex h-16 items-start justify-center' : ''}>
                                            <p
                                                className={
                                                    useVerticalXAxisLabels
                                                        ? 'whitespace-nowrap text-[10px] font-semibold text-slate-500 [writing-mode:vertical-rl] [text-orientation:mixed]'
                                                        : 'truncate text-center text-xs font-semibold text-slate-500'
                                                }
                                                title={point.label}>
                                                {point.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {chartTab === 'business' && (
                                <div className="mt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                        Doanh thu
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                                        Lợi nhuận
                                    </span>
                                </div>
                            )}
                            {chartTab === 'orders' && (
                                <div className="mt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-200" />
                                        Tổng đơn hàng
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                        Hoàn thành
                                    </span>
                                </div>
                            )}
                            {chartTab === 'users' && (
                                <div className="mt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                        Người dùng mới
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                                        Người dùng chốt đơn
                                    </span>
                                </div>
                            )}
                            {chartTab === 'products' && (
                                <div className="mt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" />
                                        Tổng sản phẩm
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                        Sản phẩm được bán
                                    </span>
                                </div>
                            )}
                            {chartTab === 'consultations' && (
                                <div className="mt-2 flex items-center justify-center gap-4 text-xs font-semibold text-slate-600">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                                        Chatbot
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                                        Dược sĩ
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-4">
                    <h2 className="text-lg font-bold text-slate-800">Top sản phẩm nổi bật</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {[
                            ['best-selling', 'Bán chạy'],
                            ['most-viewed', 'Xem nhiều'],
                            ['most-cart', 'Thêm giỏ nhiều'],
                            ['highest-revenue', 'Doanh thu cao'],
                            ['highest-profit', 'Lợi nhuận cao']
                        ].map(([id, label]) => (
                            <button
                                key={id}
                                onClick={() => setTopTab(id as typeof topTab)}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${topTab === id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 space-y-3">
                        {visibleTopProducts.slice(0, 5).map((item, idx) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                                <div className="flex items-center gap-3">
                                    <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{idx + 1}. {item.name}</p>
                                        <p className="text-xs text-slate-500">{fmtCurrency(item.unitPrice)} / {item.packageType}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-emerald-700">{topMetricRenderer(item)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default DashboardPage;
