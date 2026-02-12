import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMockAnalyticsBundle } from '../mock/mockAnalyticsData';
import { analyticsService } from '../services';
import {
    AnalyticsDataSource,
    AnalyticsFunnelPointContract,
    AnalyticsGranularity,
    AnalyticsKpiComparisonContract,
    AnalyticsKpiStatsContract,
    AnalyticsTopProductContract,
    AnalyticsTrendPointContract,
    AnalyticsViewQuickPreset,
    AnalyticsViewRangePreset,
    AnalyticsViewTimeType
} from '../types/dto';

export type AnalyticsTimeType = AnalyticsViewTimeType;
export type AnalyticsQuickPreset = AnalyticsViewQuickPreset;
export type AnalyticsRangePreset = AnalyticsViewRangePreset;
export type KpiStats = AnalyticsKpiStatsContract;
export type KpiComparison = AnalyticsKpiComparisonContract;
export type TrendPoint = AnalyticsTrendPointContract;
export type FunnelPoint = AnalyticsFunnelPointContract;
export type TopProductRow = AnalyticsTopProductContract;
interface AnalyticsFilterState {
    timeType: AnalyticsTimeType;
    quickPreset: AnalyticsQuickPreset;
    selectedDate: string;
    selectedMonth: string;
    selectedYear: number;
    rangeFrom: string;
    rangeTo: string;
}

const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toMonthInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const monthRange = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const from = `${yearMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
    return { from, to };
};

const yearRange = (year: number) => ({
    from: `${year}-01-01`,
    to: `${year}-12-31`
});
const toShortDate = (iso: string) => {
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
};
const toShortMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    return `${month}/${year}`;
};
const parseIsoDate = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
};
const addDays = (date: Date, amount: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
};
const addMonths = (date: Date, amount: number) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + amount);
    return next;
};
const inclusiveDiffDays = (from: Date, to: Date) => {
    const ms = to.getTime() - from.getTime();
    return Math.max(1, Math.floor(ms / (24 * 60 * 60 * 1000)) + 1);
};
const shiftMonthInputValue = (yearMonth: string, amount: number) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + amount);
    return toMonthInputValue(date);
};
const calcChangePercent = (current: number, previous: number) => {
    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
};
const toGranularity = (timeType: AnalyticsTimeType): AnalyticsGranularity => {
    if (timeType === 'month') return 'month';
    if (timeType === 'year') return 'year';
    return 'day';
};
const formatPeriodLabel = (period: string, granularity: AnalyticsGranularity) => {
    if (granularity === 'year') {
        return period.slice(0, 4);
    }
    if (granularity === 'month') {
        const [year, month] = period.split('-');
        return `T${month}/${year.slice(-2)}`;
    }
    const [year, month, day] = period.split('-');
    if (!day) return `${month}/${year}`;
    return `${day}/${month}`;
};
const toMockPreset = (preset: AnalyticsQuickPreset): Exclude<AnalyticsQuickPreset, 'custom'> => (preset === 'custom' ? 'thisMonth' : preset);
const MAX_RANGE_DAYS = 30;

export const useDashboardStats = () => {
    const now = new Date();
    const todayIso = toDateInputValue(now);

    const [timeType, setTimeType] = useState<AnalyticsTimeType>('month');
    const [quickPreset, setQuickPreset] = useState<AnalyticsQuickPreset>('thisMonth');
    const [dataSource, setDataSource] = useState<AnalyticsDataSource>('real');

    const [selectedDate, setSelectedDate] = useState<string>(todayIso);
    const [selectedMonth, setSelectedMonth] = useState<string>(toMonthInputValue(now));
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
    const [rangeFrom, setRangeFrom] = useState<string>(toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [rangeTo, setRangeTo] = useState<string>(todayIso);
    const [appliedFilter, setAppliedFilter] = useState<AnalyticsFilterState>({
        timeType: 'month',
        quickPreset: 'thisMonth',
        selectedDate: todayIso,
        selectedMonth: toMonthInputValue(now),
        selectedYear: now.getFullYear(),
        rangeFrom: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
        rangeTo: todayIso
    });

    const [scopeKpi, setScopeKpi] = useState<KpiStats | null>(null);
    const [kpiComparison, setKpiComparison] = useState<KpiComparison>({
        revenue: 0,
        profit: 0,
        marginPercent: 0,
        orders: 0,
        aov: 0,
        activeProducts: 0,
        soldProducts: 0,
        totalUsers: 0,
        newUsers: 0,
        purchasingUsers: 0,
        consultations: 0,
        chatbotConsultations: 0,
        pharmacistConsultations: 0
    });
    const [trend, setTrend] = useState<TrendPoint[]>([]);
    const [funnel, setFunnel] = useState<FunnelPoint[]>([]);
    const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
    const [tableRows, setTableRows] = useState<TopProductRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const applyQuickPreset = useCallback((preset: AnalyticsQuickPreset) => {
        const today = new Date();
        setQuickPreset(preset);

        if (preset === 'today') {
            setTimeType('day');
            setSelectedDate(toDateInputValue(today));
            return;
        }
        if (preset === 'thisMonth') {
            setTimeType('month');
            setSelectedMonth(toMonthInputValue(today));
            return;
        }
        if (preset === 'thisYear') {
            setTimeType('year');
            setSelectedYear(today.getFullYear());
            return;
        }
    }, []);

    const handleTimeTypeChange = useCallback((nextType: AnalyticsTimeType) => {
        setTimeType(nextType);
        if (nextType === 'day') {
            setQuickPreset('today');
        } else if (nextType === 'month') {
            setQuickPreset('thisMonth');
        } else if (nextType === 'year') {
            setQuickPreset('thisYear');
        }
    }, []);

    const handleRangeFromChange = useCallback(
        (nextFrom: string) => {
            const fromDate = parseIsoDate(nextFrom);
            let toDate = parseIsoDate(rangeTo);

            if (fromDate > toDate) {
                toDate = fromDate;
            }

            if (inclusiveDiffDays(fromDate, toDate) > MAX_RANGE_DAYS) {
                toDate = addDays(fromDate, MAX_RANGE_DAYS - 1);
            }

            setRangeFrom(toDateInputValue(fromDate));
            setRangeTo(toDateInputValue(toDate));
        },
        [rangeTo]
    );

    const handleRangeToChange = useCallback(
        (nextTo: string) => {
            let fromDate = parseIsoDate(rangeFrom);
            const toDate = parseIsoDate(nextTo);

            if (toDate < fromDate) {
                fromDate = toDate;
            }

            if (inclusiveDiffDays(fromDate, toDate) > MAX_RANGE_DAYS) {
                fromDate = addDays(toDate, -(MAX_RANGE_DAYS - 1));
            }

            setRangeFrom(toDateInputValue(fromDate));
            setRangeTo(toDateInputValue(toDate));
        },
        [rangeFrom]
    );

    const applyRangePreset = useCallback((preset: AnalyticsRangePreset) => {
        const toDate = new Date();
        const to = toDateInputValue(toDate);

        let fromDate: Date;
        if (preset === 'last7d') {
            fromDate = addDays(toDate, -6);
        } else if (preset === 'last30d') {
            fromDate = addDays(toDate, -29);
        } else if (preset === 'last6m') {
            fromDate = addMonths(toDate, -6);
        } else {
            fromDate = addMonths(toDate, -12);
        }

        const from = toDateInputValue(fromDate);
        setRangeFrom(from);
        setRangeTo(to);
    }, []);

    const buildRangeLabel = useCallback((params: {
        timeType: AnalyticsTimeType;
        selectedDate: string;
        selectedMonth: string;
        selectedYear: number;
        rangeFrom: string;
        rangeTo: string;
    }) => {
        if (params.timeType === 'day') {
            return { from: params.selectedDate, to: params.selectedDate, label: toShortDate(params.selectedDate) };
        }
        if (params.timeType === 'month') {
            const range = monthRange(params.selectedMonth);
            return { ...range, label: toShortMonth(params.selectedMonth) };
        }
        if (params.timeType === 'year') {
            const range = yearRange(params.selectedYear);
            return { ...range, label: String(params.selectedYear) };
        }
        return { from: params.rangeFrom, to: params.rangeTo, label: `${toShortDate(params.rangeFrom)} - ${toShortDate(params.rangeTo)}` };
    }, []);

    const activeRange = useMemo(
        () =>
            buildRangeLabel({
                timeType: appliedFilter.timeType,
                selectedDate: appliedFilter.selectedDate,
                selectedMonth: appliedFilter.selectedMonth,
                selectedYear: appliedFilter.selectedYear,
                rangeFrom: appliedFilter.rangeFrom,
                rangeTo: appliedFilter.rangeTo
            }),
        [appliedFilter, buildRangeLabel]
    );

    const applyCustomFilters = useCallback(() => {
        setAppliedFilter({
            timeType,
            quickPreset,
            selectedDate,
            selectedMonth,
            selectedYear,
            rangeFrom,
            rangeTo
        });
    }, [quickPreset, rangeFrom, rangeTo, selectedDate, selectedMonth, selectedYear, timeType]);

    useEffect(() => {
        if (timeType === 'range' || quickPreset === 'custom') {
            return;
        }
        setAppliedFilter({
            timeType,
            quickPreset,
            selectedDate,
            selectedMonth,
            selectedYear,
            rangeFrom,
            rangeTo
        });
    }, [quickPreset, rangeFrom, rangeTo, selectedDate, selectedMonth, selectedYear, timeType]);

    const hasPendingCustomChanges = useMemo(() => {
        if (timeType !== 'range' && quickPreset !== 'custom') {
            return false;
        }
        return (
            timeType !== appliedFilter.timeType ||
            quickPreset !== appliedFilter.quickPreset ||
            selectedDate !== appliedFilter.selectedDate ||
            selectedMonth !== appliedFilter.selectedMonth ||
            selectedYear !== appliedFilter.selectedYear ||
            rangeFrom !== appliedFilter.rangeFrom ||
            rangeTo !== appliedFilter.rangeTo
        );
    }, [appliedFilter, quickPreset, rangeFrom, rangeTo, selectedDate, selectedMonth, selectedYear, timeType]);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const buildFilterRange = (filter: AnalyticsFilterState) =>
                buildRangeLabel({
                    timeType: filter.timeType,
                    selectedDate: filter.selectedDate,
                    selectedMonth: filter.selectedMonth,
                    selectedYear: filter.selectedYear,
                    rangeFrom: filter.rangeFrom,
                    rangeTo: filter.rangeTo
                });

            const previousFilter = (() => {
                if (appliedFilter.timeType === 'day') {
                    const prevDate = toDateInputValue(addDays(parseIsoDate(appliedFilter.selectedDate), -7));
                    return { ...appliedFilter, selectedDate: prevDate };
                }
                if (appliedFilter.timeType === 'month') {
                    const prevMonth = shiftMonthInputValue(appliedFilter.selectedMonth, -1);
                    return { ...appliedFilter, selectedMonth: prevMonth };
                }
                if (appliedFilter.timeType === 'year') {
                    return { ...appliedFilter, selectedYear: appliedFilter.selectedYear - 1 };
                }
                const fromDate = parseIsoDate(activeRange.from);
                const toDate = parseIsoDate(activeRange.to);
                const rangeDays = inclusiveDiffDays(fromDate, toDate);
                const prevTo = addDays(fromDate, -1);
                const prevFrom = addDays(prevTo, -(rangeDays - 1));
                return {
                    ...appliedFilter,
                    rangeFrom: toDateInputValue(prevFrom),
                    rangeTo: toDateInputValue(prevTo)
                };
            })();

            const fetchMockBundle = async (filter: AnalyticsFilterState) => {
                const range = buildFilterRange(filter);
                const preset = toMockPreset(filter.quickPreset);
                return getMockAnalyticsBundle({
                    timeType: filter.timeType,
                    preset,
                    selectedDate: filter.selectedDate,
                    selectedMonth: filter.selectedMonth,
                    selectedYear: filter.selectedYear,
                    rangeFrom: range.from,
                    rangeTo: range.to
                });
            };

            const fetchRealBundle = async (filter: AnalyticsFilterState) => {
                const range = buildFilterRange(filter);
                const granularity = toGranularity(filter.timeType);
                const [dashboard, revenueSeries, orderSeries, userSeries, consultationSeries] = await Promise.all([
                    analyticsService.analyticsGetDashboard(range.from, range.to),
                    analyticsService.analyticsGetTimeseries('revenue', granularity, range.from, range.to),
                    analyticsService.analyticsGetTimeseries('order', granularity, range.from, range.to),
                    analyticsService.analyticsGetTimeseries('user', granularity, range.from, range.to),
                    analyticsService.analyticsGetTimeseries('consultation', granularity, range.from, range.to)
                ]);
                const mockFallback = await fetchMockBundle(filter);
                const orderByPeriod = new Map(orderSeries.points.map((p) => [p.period, p]));
                const userByPeriod = new Map(userSeries.points.map((p) => [p.period, p]));
                const consultationByPeriod = new Map(consultationSeries.points.map((p) => [p.period, p]));
                const CONSULTATION_CHATBOT_RATIO = 0.62;

                const trend = (revenueSeries.points.length ? revenueSeries.points : mockFallback.trend.map((item, idx) => ({
                    period: String(idx + 1),
                    newlyAdded: item.revenue,
                    total: item.revenue
                }))).map((revenuePoint) => {
                    const orderPoint = orderByPeriod.get(revenuePoint.period);
                    const userPoint = userByPeriod.get(revenuePoint.period);
                    const consultationPoint = consultationByPeriod.get(revenuePoint.period);
                    const totalConsultation = consultationPoint?.newlyAdded ?? 0;
                    const chatbotConsultations = Math.round(totalConsultation * CONSULTATION_CHATBOT_RATIO);
                    return {
                        label: formatPeriodLabel(revenuePoint.period, granularity),
                        revenue: revenuePoint.newlyAdded,
                        profit: Math.round(revenuePoint.newlyAdded * 0.27),
                        orders: orderPoint?.newlyAdded ?? 0,
                        newUsers: userPoint?.newlyAdded ?? 0,
                        totalUsers: userPoint?.total ?? dashboard.scopeKpi.totalUsers,
                        chatbotConsultations,
                        pharmacistConsultations: Math.max(0, totalConsultation - chatbotConsultations)
                    };
                });

                return {
                    scopeKpi: dashboard.scopeKpi,
                    trend: trend.length ? trend : mockFallback.trend,
                    funnel: mockFallback.funnel,
                    topProducts: dashboard.topProducts,
                    tableRows: dashboard.tableRows
                };
            };

            const bundle = dataSource === 'real' ? await fetchRealBundle(appliedFilter) : await fetchMockBundle(appliedFilter);
            const previousBundle = dataSource === 'real' ? await fetchRealBundle(previousFilter) : await fetchMockBundle(previousFilter);

            setScopeKpi(bundle.scopeKpi);
            setKpiComparison({
                revenue: calcChangePercent(bundle.scopeKpi.revenue, previousBundle.scopeKpi.revenue),
                profit: calcChangePercent(bundle.scopeKpi.profit, previousBundle.scopeKpi.profit),
                marginPercent: calcChangePercent(bundle.scopeKpi.marginPercent, previousBundle.scopeKpi.marginPercent),
                orders: calcChangePercent(bundle.scopeKpi.orders, previousBundle.scopeKpi.orders),
                aov: calcChangePercent(bundle.scopeKpi.aov, previousBundle.scopeKpi.aov),
                activeProducts: calcChangePercent(bundle.scopeKpi.activeProducts, previousBundle.scopeKpi.activeProducts),
                soldProducts: calcChangePercent(bundle.scopeKpi.soldProducts, previousBundle.scopeKpi.soldProducts),
                totalUsers: calcChangePercent(bundle.scopeKpi.totalUsers, previousBundle.scopeKpi.totalUsers),
                newUsers: calcChangePercent(bundle.scopeKpi.newUsers, previousBundle.scopeKpi.newUsers),
                purchasingUsers: calcChangePercent(bundle.scopeKpi.purchasingUsers, previousBundle.scopeKpi.purchasingUsers),
                consultations: calcChangePercent(bundle.scopeKpi.consultations, previousBundle.scopeKpi.consultations),
                chatbotConsultations: calcChangePercent(bundle.scopeKpi.chatbotConsultations, previousBundle.scopeKpi.chatbotConsultations),
                pharmacistConsultations: calcChangePercent(bundle.scopeKpi.pharmacistConsultations, previousBundle.scopeKpi.pharmacistConsultations)
            });
            setTrend(bundle.trend);
            setFunnel(bundle.funnel);
            setTopProducts(bundle.topProducts);
            setTableRows(bundle.tableRows);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [activeRange.from, activeRange.to, appliedFilter, buildRangeLabel, dataSource]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        timeType,
        setTimeType: handleTimeTypeChange,
        quickPreset,
        setQuickPreset: applyQuickPreset,
        dataSource,
        setDataSource,
        selectedDate,
        setSelectedDate,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        rangeFrom,
        setRangeFrom: handleRangeFromChange,
        rangeTo,
        setRangeTo: handleRangeToChange,
        applyRangePreset,
        applyCustomFilters,
        hasPendingCustomChanges,
        activeRange,
        kpiComparison,
        scopeKpi,
        trend,
        funnel,
        topProducts,
        tableRows,
        isLoading,
        error,
        refresh: fetchStats
    };
};
