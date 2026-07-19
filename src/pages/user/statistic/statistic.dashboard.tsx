'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ConfigProvider,
    Card,
    Row,
    Col,
    Table,
    Button,
    Spin,
    Empty,
    notification,
    Typography,
    Tag,
} from 'antd';
import enUS from 'antd/locale/en_US';
import {
    DollarOutlined,
    TagsOutlined,
    ShoppingCartOutlined,
    ReloadOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import axiosClient from '@/services/axiosClient';
import '@/styles/stats.table.css'
const { Title, Text } = Typography;
import 'dayjs/locale/en';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─────────────────────────────────────────────────────────────
// TYPES — mirrors ResStatisticMetricDTO from /admin/statistics/sales-sumary
// ─────────────────────────────────────────────────────────────

interface TodayMetrics {
    totalRevenue: number;
    ticketsSold: number;
    newBookings: number;
}

interface SalesChartPoint {
    date: string; // yyyy-MM-dd
    revenue: number;
    ticketsCount: number;
}

interface StatisticMetricRes {
    todayMetrics: TodayMetrics;
    chartData: SalesChartPoint[];
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const formatVND = (value: number | undefined | null): string =>
    `${Math.round(value ?? 0).toLocaleString('vi-VN')}đ`;

const formatCompactVND = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `${value}`;
};

// ✅ Hardcoded English date formatters — do NOT use dayjs's 'ddd' / 'MMM' / 'dddd'
// tokens here, since those resolve through dayjs's *global* locale, which some
// other part of the app may switch away from English (e.g. to zh-cn), causing
// dates to render in Chinese even though `import 'dayjs/locale/en'` runs here.
const formatShortDate = (value: string): string => {
    const d = dayjs(value);
    return `${WEEKDAY_SHORT[d.day()]}, ${d.format('DD')} ${MONTH_SHORT[d.month()]} ${d.format('YYYY')}`;
};

const formatLongDateUpper = (value: string): string => {
    const d = dayjs(value);
    return `${WEEKDAY_LONG[d.day()]}, ${MONTH_SHORT[d.month()]} ${d.format('DD, YYYY')}`.toUpperCase();
};

// ─────────────────────────────────────────────────────────────
// CUSTOM CHART TOOLTIP
// ─────────────────────────────────────────────────────────────

const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const revenue = payload.find((p: any) => p.dataKey === 'revenue')?.value ?? 0;
    const tickets = payload.find((p: any) => p.dataKey === 'ticketsCount')?.value ?? 0;

    return (
        <div
            style={{
                background: '#181818',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 8,
                padding: '10px 14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
        >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: 0.5 }}>
                {formatLongDateUpper(label)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#e63946', display: 'inline-block' }} />
                <span style={{ fontSize: 13, color: '#f0ece3' }}>Revenue:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e63946' }}>{formatVND(revenue)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
                <span style={{ fontSize: 13, color: '#f0ece3' }}>Tickets sold:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{tickets}</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────

export const StatisticsDashboard: React.FC = () => {
    const [api, contextHolder] = notification.useNotification();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<StatisticMetricRes | null>(null);
    const [lastUpdated, setLastUpdated] = useState<dayjs.Dayjs | null>(null);

    const fetchStatistics = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get<StatisticMetricRes>('/admin/statistics/sales-sumary');
            const payload = (res as any)?.data ?? res;
            setData(payload);
            setLastUpdated(dayjs());
        } catch (error) {
            api.error({
                message: 'Failed to load statistics',
                description: 'Could not fetch the sales report. Please try again.',
                placement: 'topRight',
            });
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    const chartData = useMemo(() => data?.chartData ?? [], [data]);

    // Week-over-average trend for today's revenue, computed purely from the 7-day series
    const revenueTrend = useMemo(() => {
        if (!data || chartData.length === 0) return null;
        const today = dayjs().format('YYYY-MM-DD');
        const priorDays = chartData.filter((d) => d.date !== today);
        if (priorDays.length === 0) return null;
        const avgPrior = priorDays.reduce((sum, d) => sum + Number(d.revenue), 0) / priorDays.length;
        if (avgPrior <= 0) return null;
        const diff = ((data.todayMetrics.totalRevenue - avgPrior) / avgPrior) * 100;
        return diff;
    }, [data, chartData]);

    const weekTotals = useMemo(() => {
        return chartData.reduce(
            (acc, d) => ({
                revenue: acc.revenue + Number(d.revenue),
                tickets: acc.tickets + Number(d.ticketsCount),
            }),
            { revenue: 0, tickets: 0 },
        );
    }, [chartData]);

    const tableColumns = [
        {
            title: 'DATE',
            dataIndex: 'date',
            key: 'date',
            render: (value: string) => (
                <span style={{ color: '#f0ece3', fontWeight: 600 }}>
                    {formatShortDate(value)}
                    {dayjs(value).isSame(dayjs(), 'day') && (
                        <Tag color="#e63946" style={{ marginLeft: 8 }}>
                            TODAY
                        </Tag>
                    )}
                </span>
            ),
        },
        {
            title: 'TICKETS SOLD',
            dataIndex: 'ticketsCount',
            key: 'ticketsCount',
            align: 'right' as const,
            render: (value: number) => <span style={{ color: '#3b82f6', fontWeight: 600 }}>{value}</span>,
        },
        {
            title: 'REVENUE',
            dataIndex: 'revenue',
            key: 'revenue',
            align: 'right' as const,
            render: (value: number) => (
                <span style={{ color: '#e63946', fontWeight: 700 }}>{formatVND(value)}</span>
            ),
        },
    ];

    return (
        <ConfigProvider locale={enUS}>
            <div style={{ padding: '24px 16px', background: '#141414', minHeight: 'calc(100vh - 64px)', color: '#f5f5f5' }}>
                {contextHolder}

                {/* HEADER */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                        gap: 12,
                        marginBottom: 24,
                    }}
                >
                    <div>
                        <Title
                            level={2}
                            style={{
                                color: '#ffd700',
                                letterSpacing: '1px',
                                fontWeight: 600,
                                marginBottom: 4,
                                textTransform: 'uppercase',
                            }}
                        >
                            Sales Statistics
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                            Revenue and ticket performance overview
                        </Text>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {lastUpdated && (
                            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                                <ClockCircleOutlined style={{ marginRight: 6 }} />
                                Updated {lastUpdated.format('HH:mm:ss')}
                            </Text>
                        )}
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchStatistics}
                            loading={loading}
                            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: '#f0ece3' }}
                        >
                            Refresh
                        </Button>
                    </div>
                </div>

                <Spin spinning={loading && !data}>
                    {!data && !loading ? (
                        <Empty description={<span style={{ color: 'rgba(255,255,255,0.4)' }}>No data available</span>} style={{ padding: '80px 0' }} />
                    ) : (
                        <>
                            {/* TODAY OVERVIEW — ticket-stub style hero cards */}
                            <Row gutter={20} style={{ marginBottom: 24 }}>
                                <Col xs={24} md={8}>
                                    <Card
                                        style={{
                                            background: 'linear-gradient(135deg, #1a1a1a 0%, #201313 100%)',
                                            border: '1px solid rgba(230,57,70,0.25)',
                                            borderRadius: 10,
                                        }}
                                        styles={{ body: { padding: 20 } }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                                TODAY&apos;S REVENUE
                                            </div>
                                            <div
                                                style={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 8,
                                                    background: 'rgba(230,57,70,0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <DollarOutlined style={{ color: '#e63946', fontSize: 16 }} />
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 30,
                                                fontWeight: 700,
                                                color: '#e63946',
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: 0.5,
                                                marginTop: 10,
                                            }}
                                        >
                                            {formatVND(data?.todayMetrics.totalRevenue)}
                                        </div>
                                        {revenueTrend !== null && (
                                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {revenueTrend >= 0 ? (
                                                    <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 11 }} />
                                                ) : (
                                                    <ArrowDownOutlined style={{ color: '#ff4d4f', fontSize: 11 }} />
                                                )}
                                                <Text style={{ fontSize: 12, color: revenueTrend >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                                                    {Math.abs(revenueTrend).toFixed(1)}%
                                                </Text>
                                                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                                                    vs 6-day average
                                                </Text>
                                            </div>
                                        )}
                                    </Card>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Card
                                        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}
                                        styles={{ body: { padding: 20 } }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                                TICKETS SOLD TODAY
                                            </div>
                                            <div
                                                style={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 8,
                                                    background: 'rgba(59,130,246,0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <TagsOutlined style={{ color: '#3b82f6', fontSize: 16 }} />
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 30,
                                                fontWeight: 700,
                                                color: '#3b82f6',
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: 0.5,
                                                marginTop: 10,
                                            }}
                                        >
                                            {(data?.todayMetrics.ticketsSold ?? 0).toLocaleString('vi-VN')}
                                        </div>
                                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8, display: 'block' }}>
                                            Seats booked and paid today
                                        </Text>
                                    </Card>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Card
                                        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}
                                        styles={{ body: { padding: 20 } }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                                NEW BOOKINGS TODAY
                                            </div>
                                            <div
                                                style={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 8,
                                                    background: 'rgba(245,158,11,0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <ShoppingCartOutlined style={{ color: '#f59e0b', fontSize: 16 }} />
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 30,
                                                fontWeight: 700,
                                                color: '#f59e0b',
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: 0.5,
                                                marginTop: 10,
                                            }}
                                        >
                                            {(data?.todayMetrics.newBookings ?? 0).toLocaleString('vi-VN')}
                                        </div>
                                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8, display: 'block' }}>
                                            Successful orders placed today
                                        </Text>
                                    </Card>
                                </Col>
                            </Row>

                            {/* 7-DAY CHART */}
                            <Card
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                        <span style={{ color: '#ffd700', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>
                                            LAST 7 DAYS PERFORMANCE
                                        </span>
                                        <div style={{ display: 'flex', gap: 20 }}>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                                Total revenue:{' '}
                                                <span style={{ color: '#e63946', fontWeight: 700 }}>{formatVND(weekTotals.revenue)}</span>
                                            </span>
                                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                                Total tickets:{' '}
                                                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{weekTotals.tickets}</span>
                                            </span>
                                        </div>
                                    </div>
                                }
                                styles={{ body: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', padding: '24px 12px 12px' } }}
                                style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)', marginBottom: 24 }}
                            >
                                {chartData.length === 0 ? (
                                    <Empty description={<span style={{ color: 'rgba(255,255,255,0.4)' }}>No sales in the last 7 days</span>} style={{ padding: '60px 0' }} />
                                ) : (
                                    <ResponsiveContainer width="100%" height={340}>
                                        <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(v) => dayjs(v).format('DD/MM')}
                                                stroke="rgba(255,255,255,0.3)"
                                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                stroke="rgba(59,130,246,0.6)"
                                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                allowDecimals={false}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                stroke="rgba(230,57,70,0.6)"
                                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => formatCompactVND(v)}
                                            />
                                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="ticketsCount"
                                                name="Tickets sold"
                                                fill="#3b82f6"
                                                fillOpacity={0.35}
                                                radius={[4, 4, 0, 0]}
                                                barSize={28}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="revenue"
                                                name="Revenue"
                                                stroke="#e63946"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#e63946', strokeWidth: 0 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </Card>

                            {/* DAILY BREAKDOWN TABLE */}
                            <Card
                                title={<span style={{ color: '#ffd700', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>DAILY BREAKDOWN</span>}
                                styles={{ body: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', padding: 0 } }}
                                style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
                            >
                                <Table
                                    className="stats-table"
                                    dataSource={[...chartData].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())}
                                    columns={tableColumns}
                                    rowKey="date"
                                    pagination={false}
                                    locale={{ emptyText: <Empty description={<span style={{ color: 'rgba(255,255,255,0.4)' }}>No data</span>} /> }}
                                />
                            </Card>
                        </>
                    )}
                </Spin>
            </div>
        </ConfigProvider>
    );
};

export default StatisticsDashboard;