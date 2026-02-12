import {
    AnalyticsFunnelPointContract,
    AnalyticsKpiStatsContract,
    AnalyticsTopProductContract,
    AnalyticsTrendPointContract,
    AnalyticsViewQuickPreset,
    AnalyticsViewTimeType
} from '../types/dto';

interface MockInput {
    timeType: AnalyticsViewTimeType;
    preset: Exclude<AnalyticsViewQuickPreset, 'custom'>;
    selectedDate: string;
    selectedMonth: string;
    selectedYear: number;
    rangeFrom: string;
    rangeTo: string;
}

export interface MockBundle {
    overviewKpi: AnalyticsKpiStatsContract;
    scopeKpi: AnalyticsKpiStatsContract;
    trend: AnalyticsTrendPointContract[];
    funnel: AnalyticsFunnelPointContract[];
    topProducts: AnalyticsTopProductContract[];
    tableRows: AnalyticsTopProductContract[];
}

const BASE_OVERVIEW: AnalyticsKpiStatsContract = {
    revenue: 12876000000,
    profit: 3476500000,
    marginPercent: 27,
    orders: 32145,
    newUsers: 18640,
    totalUsers: 246580,
    activeProducts: 5243,
    soldProducts: 3180,
    purchasingUsers: 27450,
    aov: 400550,
    orderNew: 3520,
    orderCancelled: 1420,
    orderCompleted: 27205,
    consultations: 14280,
    chatbotConsultations: 9180,
    pharmacistConsultations: 5100
};

const BASE_TOP_PRODUCTS: AnalyticsTopProductContract[] = [
    { id: '1', image: 'https://placehold.co/64x64?text=A', name: 'Thuốc A - Vitamin C 1000mg', sku: 'SP-VC1000-01', unitPrice: 25000, packageType: 'Hộp', views: 126520, addToCart: 18450, purchases: 8240, revenue: 1245000000, profit: 351200000, conversionRate: 6.51 },
    { id: '2', image: 'https://placehold.co/64x64?text=B', name: 'Thuốc B - Omega 3 Fish Oil', sku: 'SP-OMG3-220', unitPrice: 189000, packageType: 'Lọ', views: 112340, addToCart: 16320, purchases: 7395, revenue: 1098000000, profit: 312000000, conversionRate: 6.58 },
    { id: '3', image: 'https://placehold.co/64x64?text=C', name: 'Thuốc C - Canxi + D3', sku: 'SP-CAD3-050', unitPrice: 145000, packageType: 'Hộp', views: 98760, addToCart: 14160, purchases: 6210, revenue: 892000000, profit: 241100000, conversionRate: 6.29 },
    { id: '4', image: 'https://placehold.co/64x64?text=D', name: 'Thuốc D - Collagen Premium', sku: 'SP-COL-PRM', unitPrice: 320000, packageType: 'Hộp', views: 85320, addToCart: 11220, purchases: 4980, revenue: 845000000, profit: 226200000, conversionRate: 5.84 },
    { id: '5', image: 'https://placehold.co/64x64?text=E', name: 'Thuốc E - MultiVitamin Nam', sku: 'SP-MVM-NAM', unitPrice: 175000, packageType: 'Hộp', views: 81220, addToCart: 10540, purchases: 4710, revenue: 736000000, profit: 205800000, conversionRate: 5.80 },
    { id: '6', image: 'https://placehold.co/64x64?text=F', name: 'Thuốc F - Siro ho thảo dược', sku: 'SP-SIRO-HO', unitPrice: 78000, packageType: 'Chai', views: 70210, addToCart: 9640, purchases: 4350, revenue: 412000000, profit: 119000000, conversionRate: 6.20 },
    { id: '7', image: 'https://placehold.co/64x64?text=G', name: 'Thuốc G - Men vi sinh', sku: 'SP-PROBIO-10', unitPrice: 129000, packageType: 'Hộp', views: 67540, addToCart: 8850, purchases: 3910, revenue: 501000000, profit: 141000000, conversionRate: 5.79 },
    { id: '8', image: 'https://placehold.co/64x64?text=H', name: 'Thuốc H - Gel rửa tay', sku: 'SP-SAN-HAND', unitPrice: 35000, packageType: 'Tuýp', views: 59220, addToCart: 7480, purchases: 3320, revenue: 224000000, profit: 62300000, conversionRate: 5.61 },
    { id: '9', image: 'https://placehold.co/64x64?text=I', name: 'Thuốc I - Khẩu trang 4 lớp', sku: 'SP-MASK-4L', unitPrice: 45000, packageType: 'Hộp', views: 55890, addToCart: 6950, purchases: 3170, revenue: 198000000, profit: 54100000, conversionRate: 5.67 },
    { id: '10', image: 'https://placehold.co/64x64?text=J', name: 'Thuốc J - Nhỏ mắt dưỡng ẩm', sku: 'SP-EYE-DROP', unitPrice: 52000, packageType: 'Lọ', views: 49750, addToCart: 6020, purchases: 2740, revenue: 186000000, profit: 49200000, conversionRate: 5.50 }
];

const parseIsoDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
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

const diffDays = (from: Date, to: Date) => {
    const ms = to.getTime() - from.getTime();
    return Math.max(1, Math.floor(ms / (24 * 60 * 60 * 1000)) + 1);
};
const dayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    return Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
};

const fmtDayLabel = (date: Date) =>
    `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

const fmtMonthLabel = (date: Date) =>
    `T${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;

const buildLabels = ({ timeType, selectedDate, selectedMonth, selectedYear, rangeFrom, rangeTo }: MockInput): string[] => {
    if (timeType === 'day') {
        const end = parseIsoDate(selectedDate);
        return Array.from({ length: 7 }, (_, idx) => fmtDayLabel(addDays(end, idx - 6)));
    }

    if (timeType === 'month') {
        const [year, month] = selectedMonth.split('-').map(Number);
        const end = new Date(year, month - 1, 1);
        return Array.from({ length: 6 }, (_, idx) => fmtMonthLabel(addMonths(end, idx - 5)));
    }

    if (timeType === 'year') {
        return Array.from({ length: 5 }, (_, idx) => String(selectedYear - 4 + idx));
    }

    const fromDate = parseIsoDate(rangeFrom);
    const toDate = parseIsoDate(rangeTo);
    const totalDays = diffDays(fromDate, toDate);
    const points = Math.min(30, totalDays);
    if (points <= 1) {
        return [fmtDayLabel(toDate)];
    }
    return Array.from({ length: points }, (_, idx) => fmtDayLabel(addDays(fromDate, idx)));
};

const factorByType = (timeType: AnalyticsViewTimeType, preset: Exclude<AnalyticsViewQuickPreset, 'custom'>) => {
    if (preset === 'today') {
        return 0.024;
    }
    if (preset === 'thisYear') {
        return 0.93;
    }
    if (timeType === 'range') {
        return 0.41;
    }
    if (timeType === 'year') {
        return 0.9;
    }
    if (timeType === 'month') {
        return 0.31;
    }
    return 0.2;
};
const periodVariance = ({ timeType, selectedDate, selectedMonth, selectedYear, rangeFrom, rangeTo }: MockInput) => {
    if (timeType === 'day') {
        const date = parseIsoDate(selectedDate);
        return 0.94 + (dayOfYear(date) % 13) / 100;
    }
    if (timeType === 'month') {
        const [year, month] = selectedMonth.split('-').map(Number);
        return 0.92 + ((year * 12 + month) % 15) / 100;
    }
    if (timeType === 'year') {
        return 0.9 + (selectedYear % 17) / 100;
    }

    const fromDate = parseIsoDate(rangeFrom);
    const toDate = parseIsoDate(rangeTo);
    const span = diffDays(fromDate, toDate);
    return 0.9 + ((span + dayOfYear(toDate)) % 19) / 100;
};

const toInt = (n: number) => Math.max(0, Math.round(n));

export const getMockAnalyticsBundle = ({ timeType, preset, selectedDate, selectedMonth, selectedYear, rangeFrom, rangeTo }: MockInput): MockBundle => {
    const factor = factorByType(timeType, preset);
    const variance = periodVariance({ timeType, preset, selectedDate, selectedMonth, selectedYear, rangeFrom, rangeTo });
    const scopedRevenue = toInt(BASE_OVERVIEW.revenue * factor * variance);
    const scopedProfit = toInt(scopedRevenue * 0.27);
    const scopedOrders = toInt(BASE_OVERVIEW.orders * factor);
    const scopedUsers = toInt(BASE_OVERVIEW.newUsers * factor);
    const scopedAov = scopedOrders > 0 ? scopedRevenue / scopedOrders : 0;
    const scopedPurchasingUsers = toInt(BASE_OVERVIEW.purchasingUsers * factor);
    const scopedSoldProducts = toInt(BASE_OVERVIEW.soldProducts * (0.65 + factor * 0.35));
    const scopedConsultations = toInt(BASE_OVERVIEW.consultations * factor * (0.9 + variance * 0.1));
    const scopedChatbotConsultations = toInt(scopedConsultations * 0.62);

    const scopeKpi: AnalyticsKpiStatsContract = {
        revenue: scopedRevenue,
        profit: scopedProfit,
        marginPercent: scopedRevenue > 0 ? (scopedProfit / scopedRevenue) * 100 : 0,
        orders: scopedOrders,
        newUsers: scopedUsers,
        totalUsers: toInt(BASE_OVERVIEW.totalUsers * (0.92 + factor * 0.08)),
        activeProducts: BASE_OVERVIEW.activeProducts,
        soldProducts: scopedSoldProducts,
        purchasingUsers: scopedPurchasingUsers,
        aov: scopedAov,
        orderNew: toInt(scopedOrders * 0.16),
        orderCancelled: toInt(scopedOrders * 0.06),
        orderCompleted: toInt(scopedOrders * 0.78),
        consultations: scopedConsultations,
        chatbotConsultations: scopedChatbotConsultations,
        pharmacistConsultations: Math.max(0, scopedConsultations - scopedChatbotConsultations)
    };

    const labels = buildLabels({ timeType, preset, selectedDate, selectedMonth, selectedYear, rangeFrom, rangeTo });
    const trend = labels.map((label, idx) => {
        const seasonal = 0.78 + ((idx % 5) * 0.08);
        const revenue = toInt((scopedRevenue / labels.length) * seasonal);
        const orders = toInt((scopedOrders / labels.length) * (0.82 + ((idx % 4) * 0.07)));
        const users = toInt((scopedUsers / labels.length) * (0.75 + ((idx % 6) * 0.06)));
        const consultationTotal = toInt((scopedConsultations / labels.length) * (0.8 + ((idx % 4) * 0.08)));
        const chatbotConsultations = toInt(consultationTotal * 0.62);
        return {
            label,
            revenue,
            profit: toInt(revenue * 0.27),
            orders,
            newUsers: users,
            totalUsers: toInt(BASE_OVERVIEW.newUsers * (0.7 + (idx / Math.max(labels.length, 1)) * 0.3)),
            chatbotConsultations,
            pharmacistConsultations: Math.max(0, consultationTotal - chatbotConsultations)
        };
    });

    const purchases = Math.max(scopeKpi.orders, 1);
    const checkout = toInt(purchases / 0.63);
    const addToCart = toInt(checkout / 0.44);
    const click = toInt(addToCart / 0.31);
    const view = toInt(click / 0.24);
    const funnel: AnalyticsFunnelPointContract[] = [
        { step: 'Xem sản phẩm', value: view, nextRate: click / view },
        { step: 'Nhấn vào sản phẩm', value: click, nextRate: addToCart / click },
        { step: 'Thêm vào giỏ', value: addToCart, nextRate: checkout / addToCart },
        { step: 'Bắt đầu thanh toán', value: checkout, nextRate: purchases / checkout },
        { step: 'Mua hàng thành công', value: purchases }
    ];

    const topProducts = BASE_TOP_PRODUCTS.map((item) => ({
        ...item,
        views: toInt(item.views * factor * variance * 1.12),
        addToCart: toInt(item.addToCart * factor * variance * 1.09),
        purchases: toInt(item.purchases * factor * variance * 1.06),
        revenue: toInt(item.revenue * factor * variance),
        profit: toInt(item.profit * factor * variance)
    }));

    return {
        overviewKpi: BASE_OVERVIEW,
        scopeKpi,
        trend,
        funnel,
        topProducts,
        tableRows: topProducts
    };
};
