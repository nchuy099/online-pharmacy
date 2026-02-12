export type AnalyticsMetric = 'user' | 'product' | 'order' | 'revenue' | 'consultation';
export type AnalyticsGranularity = 'day' | 'month' | 'year';
export type AnalyticsViewTimeType = 'day' | 'month' | 'year' | 'range';
export type AnalyticsViewQuickPreset = 'today' | 'thisMonth' | 'thisYear' | 'custom';
export type AnalyticsViewRangePreset = 'last7d' | 'last30d' | 'last6m' | 'last12m';
export type AnalyticsDataSource = 'real' | 'mock';

export interface DomainCountMetrics {
    newlyAdded: number;
    total: number;
}

export interface ProductMetrics extends DomainCountMetrics {
    activeTotal: number;
}

export interface RevenueMetrics {
    newlyAdded: number;
    total: number;
}

export interface AnalyticsSummaryResponse {
    snapshotDate: string;
    users: DomainCountMetrics;
    products: ProductMetrics;
    orders: DomainCountMetrics;
    revenue: RevenueMetrics;
    consultations: DomainCountMetrics;
}

export interface AnalyticsRangeResponse {
    from: string;
    to: string;
    deliveredOrders: number;
    deliveredRevenue: number;
    consultations: number;
}

export interface AnalyticsTimeseriesPoint {
    period: string;
    newlyAdded: number;
    total: number;
}

export interface AnalyticsTimeseriesResponse {
    metric: string;
    granularity: string;
    from: string;
    to: string;
    points: AnalyticsTimeseriesPoint[];
}

export interface AnalyticsKpiStatsContract {
    revenue: number;
    profit: number;
    marginPercent: number;
    orders: number;
    newUsers: number;
    totalUsers: number;
    activeProducts: number;
    soldProducts: number;
    purchasingUsers: number;
    aov: number;
    orderNew: number;
    orderCancelled: number;
    orderCompleted: number;
    consultations: number;
    chatbotConsultations: number;
    pharmacistConsultations: number;
}

export interface AnalyticsKpiComparisonContract {
    revenue: number;
    profit: number;
    marginPercent: number;
    orders: number;
    aov: number;
    activeProducts: number;
    soldProducts: number;
    totalUsers: number;
    newUsers: number;
    purchasingUsers: number;
    consultations: number;
    chatbotConsultations: number;
    pharmacistConsultations: number;
}

export interface AnalyticsTrendPointContract {
    label: string;
    revenue: number;
    profit: number;
    orders: number;
    newUsers: number;
    totalUsers: number;
    chatbotConsultations: number;
    pharmacistConsultations: number;
}

export interface AnalyticsFunnelPointContract {
    step: string;
    value: number;
    nextRate?: number;
}

export interface AnalyticsTopProductContract {
    id: string;
    image: string;
    name: string;
    sku: string;
    unitPrice: number;
    packageType: string;
    views: number;
    addToCart: number;
    purchases: number;
    revenue: number;
    profit: number;
    conversionRate: number;
}

export interface AnalyticsDashboardBundleContract {
    scopeKpi: AnalyticsKpiStatsContract;
    trend: AnalyticsTrendPointContract[];
    funnel: AnalyticsFunnelPointContract[];
    topProducts: AnalyticsTopProductContract[];
    tableRows: AnalyticsTopProductContract[];
}
