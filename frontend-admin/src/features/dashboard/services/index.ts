import dashboardApi from '../api';
import {
    AnalyticsGranularity,
    AnalyticsDashboardBundleContract,
    AnalyticsMetric,
    AnalyticsRangeResponse,
    AnalyticsSummaryResponse,
    AnalyticsTimeseriesResponse
} from '../types/dto';

export interface AnalyticsServiceContract {
    analyticsGetSummary(date: string): Promise<AnalyticsSummaryResponse>;
    analyticsGetRange(from: string, to: string): Promise<AnalyticsRangeResponse>;
    analyticsGetDashboard(from: string, to: string): Promise<AnalyticsDashboardBundleContract>;
    analyticsGetTimeseries(
        metric: AnalyticsMetric,
        granularity: AnalyticsGranularity,
        from: string,
        to: string
    ): Promise<AnalyticsTimeseriesResponse>;
}

export const analyticsService: AnalyticsServiceContract = {
    analyticsGetSummary: async (date: string) => dashboardApi.getSummary(date),
    analyticsGetRange: async (from: string, to: string) => dashboardApi.getRange(from, to),
    analyticsGetDashboard: async (from: string, to: string) => dashboardApi.getDashboard(from, to),
    analyticsGetTimeseries: async (
        metric: AnalyticsMetric,
        granularity: AnalyticsGranularity,
        from: string,
        to: string
    ) => dashboardApi.getTimeseries(metric, granularity, from, to)
};
