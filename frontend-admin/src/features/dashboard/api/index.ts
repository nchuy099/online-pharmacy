import axios from '../../../shared/services/axios';
import { ApiResponse } from '../../../shared/types';
import {
    AnalyticsGranularity,
    AnalyticsMetric,
    AnalyticsDashboardBundleContract,
    AnalyticsRangeResponse,
    AnalyticsSummaryResponse,
    AnalyticsTimeseriesResponse
} from '../types/dto';

export interface AnalyticsApiContract {
    getSummary(date: string): Promise<AnalyticsSummaryResponse>;
    getRange(from: string, to: string): Promise<AnalyticsRangeResponse>;
    getDashboard(from: string, to: string): Promise<AnalyticsDashboardBundleContract>;
    getTimeseries(
        metric: AnalyticsMetric,
        granularity: AnalyticsGranularity,
        from: string,
        to: string
    ): Promise<AnalyticsTimeseriesResponse>;
}

const dashboardApi: AnalyticsApiContract = {
    getSummary: async (date: string): Promise<AnalyticsSummaryResponse> => {
        const response = await axios.get<ApiResponse<AnalyticsSummaryResponse>>('/admin/analytics/summary', {
            params: { date }
        });
        return response.data.data!;
    },
    getRange: async (from: string, to: string): Promise<AnalyticsRangeResponse> => {
        const response = await axios.get<ApiResponse<AnalyticsRangeResponse>>('/admin/analytics/range', {
            params: { from, to }
        });
        return response.data.data!;
    },
    getDashboard: async (from: string, to: string): Promise<AnalyticsDashboardBundleContract> => {
        const response = await axios.get<ApiResponse<AnalyticsDashboardBundleContract>>('/admin/analytics/dashboard', {
            params: { from, to }
        });
        return response.data.data!;
    },
    getTimeseries: async (
        metric: AnalyticsMetric,
        granularity: AnalyticsGranularity,
        from: string,
        to: string
    ): Promise<AnalyticsTimeseriesResponse> => {
        const response = await axios.get<ApiResponse<AnalyticsTimeseriesResponse>>('/admin/analytics/timeseries', {
            params: { metric, granularity, from, to }
        });
        return response.data.data!;
    }
};

export default dashboardApi;
