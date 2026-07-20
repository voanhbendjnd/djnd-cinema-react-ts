'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    DatePicker,
    Select,
    Button,
    Space,
    Empty,
    Spin,
    Row,
    Col,
    Statistic,
    Tag, Image,
} from 'antd';
import {
    ReloadOutlined,
    FireOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { useTopMoviesFilter } from '@/hooks/use-top-movies-filter';
import {statisticsService, type TopMovieProjection} from "@/services/satistics.service.ts";
import {baseURL} from "@/services/axiosClient.ts";

const TopMoviesPage: React.FC = () => {
    const [movies, setMovies] = useState<TopMovieProjection[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const { dateRange, setDateRange, limit, setLimit, getFilterParams, resetFilters } =
        useTopMoviesFilter();

    // ✅ Fetch top movies
    const fetchTopMovies = async () => {
        // @ts-ignore
        try {
            setLoading(true);
            const params = getFilterParams();
            const res = await statisticsService.getTopMovies(params);
            setMovies(res.data);

            // Calculate total revenue
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const total = res.data.reduce((sum, movie) => sum + (movie.totalRevenue || 0), 0);
            setTotalRevenue(total);
        } catch (error) {
            console.error('Failed to fetch top movies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopMovies();
    }, []);

    const handleDateRangeChange = (dates: any) => {
        if (dates && dates[0] && dates[1]) {
            setDateRange([dates[0], dates[1]]);
        }
    };

    const handleLimitChange = (value: number) => {
        setLimit(value);
    };

    const handleApplyFilters = () => {
        fetchTopMovies();
    };

    const handleReset = () => {
        resetFilters();
    };

    // ✅ Table columns
    const columns = [
        {
            title: 'Rank',
            dataIndex: 'rank',
            key: 'rank',
            width: 80,
            render: (_: any, __: any, index: number) => (
                <Tag
                    color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'cyan'}
                    style={{ fontWeight: 700, fontSize: 12 }}
                >
                    #{index + 1}
                </Tag>
            ),
        },
        {
            title: 'Movie Poster',
            dataIndex: 'posterUrl',
            key: 'posterUrl',
            width: 100,
            render: (posterUrl: string, record: TopMovieProjection) => (
                <Image
                    src={
                        posterUrl
                            ? `${baseURL}/api/v1/files/${posterUrl}`
                            : '/placeholder.png'
                    }
                    alt={record.movieTitle}
                    width={80}
                    height={120}
                    style={{
                        objectFit: 'cover',
                        borderRadius: 6,
                    }}
                    preview={false}
                />
            )
        },
        {
            title: 'Movie Title',
            dataIndex: 'movieTitle',
            key: 'movieTitle',
            render: (text: string) => (
                <span style={{ fontWeight: 600, color: '#fff' }}>{text}</span>
            ),
        },
        {
            title: 'Total Revenue',
            dataIndex: 'totalRevenue',
            key: 'totalRevenue',
            width: 160,
            align: 'right' as const,
            render: (amount: number) => (
                <span style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>
                    ${(amount / 1000000).toFixed(2)}
                </span>
            ),
            sorter: (a: TopMovieProjection, b: TopMovieProjection) =>
                (b.totalRevenue || 0) - (a.totalRevenue || 0),
        },
        {
            title: 'Tickets Sold',
            dataIndex: 'ticketsSold',
            key: 'ticketsSold',
            width: 140,
            align: 'center' as const,
            render: (count: number) => (
                <span style={{ fontWeight: 600, color: '#e63946' }}>{count}</span>
            ),
            sorter: (a: TopMovieProjection, b: TopMovieProjection) =>
                (b.ticketsSold || 0) - (a.ticketsSold || 0),
        },
        {
            title: 'Total Showtimes',
            dataIndex: 'totalShowtimes',
            key: 'totalShowtimes',
            width: 140,
            align: 'center' as const,
            render: (count: number) => (
                <span style={{ fontWeight: 600, color: '#3b82f6' }}>{count}</span>
            ),
        },
        {
            title: 'Revenue/Ticket',
            dataIndex: 'revenuePerTicket',
            key: 'revenuePerTicket',
            width: 150,
            align: 'right' as const,
            render: (_: any, record: TopMovieProjection) => {
                const perTicket = record.ticketsSold
                    ? record.totalRevenue / record.ticketsSold
                    : 0;
                return (
                    <span style={{ fontWeight: 600, color: '#f59e0b' }}>
                        ${(perTicket / 1000000).toFixed(2)}
                    </span>
                );
            },
        },
    ];

    return (
        <div
            style={{
                minHeight: '100vh',
                // background: 'linear-gradient(135deg, #1a0000 0%, #3d0000 100%)',
                padding: '40px 20px',
            }}
        >
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* HEADER */}
                <div style={{ marginBottom: 30 }}>
                    <h1
                        style={{
                            fontSize: 32,
                            fontWeight: 700,
                            color: '#fff',
                            margin: '0 0 8px 0',
                            fontFamily: "'Bebas Neue', sans-serif",
                            letterSpacing: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <FireOutlined style={{ fontSize: 36, color: '#e63946' }} />
                        TOP MOVIES BY REVENUE
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        Track your highest-performing movies by revenue, ticket sales, and showtimes
                    </p>
                </div>

                {/* STATISTICS CARDS */}
                <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: 12,
                            }}
                        >
                            <Statistic
                                title="Total Revenue"
                                value={totalRevenue / 1000000}
                                prefix="$"
                                precision={2}
                                valueStyle={{ color: '#10b981', fontSize: 24, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            style={{
                                background: 'rgba(230, 57, 70, 0.1)',
                                border: '1px solid rgba(230, 57, 70, 0.3)',
                                borderRadius: 12,
                            }}
                        >
                            <Statistic
                                title="Total Tickets Sold"
                                value={movies.reduce((sum, m) => sum + (m.ticketsSold || 0), 0)}
                                valueStyle={{ color: '#e63946', fontSize: 24, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: 12,
                            }}
                        >
                            <Statistic
                                title="Total Showtimes"
                                value={movies.reduce((sum, m) => sum + (m.totalShowtimes || 0), 0)}
                                valueStyle={{ color: '#3b82f6', fontSize: 24, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: 12,
                            }}
                        >
                            <Statistic
                                title="Top Movies Count"
                                value={movies.length}
                                valueStyle={{ color: '#f59e0b', fontSize: 24, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* FILTER CARD */}
                <Card
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        marginBottom: 24,
                    }}
                >
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        {/* DATE RANGE */}
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: 8,
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.6)',
                                    fontWeight: 600,
                                    letterSpacing: 0.5,
                                }}
                            >
                                <CalendarOutlined style={{ marginRight: 6 }} />
                                DATE RANGE
                            </label>
                            <DatePicker.RangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                format="DD/MM/YYYY"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 6,
                                }}
                            />
                        </div>

                        {/* LIMIT */}
                        <div style={{ minWidth: 150 }}>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: 8,
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.6)',
                                    fontWeight: 600,
                                    letterSpacing: 0.5,
                                }}
                            >
                                <FireOutlined style={{ marginRight: 6 }} />
                                SHOW TOP
                            </label>
                            <Select
                                value={limit}
                                onChange={handleLimitChange}
                                options={[
                                    { label: 'Top 5', value: 5 },
                                    { label: 'Top 10', value: 10 },
                                    { label: 'Top 15', value: 15 },
                                    { label: 'Top 20', value: 20 },
                                    { label: 'Top 50', value: 50 },
                                ]}
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                }}
                            />
                        </div>

                        {/* ACTION BUTTONS */}
                        <Space>
                            <Button
                                type="primary"
                                onClick={handleApplyFilters}
                                loading={loading}
                                style={{
                                    background: '#e63946',
                                    border: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Apply Filters
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleReset}
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#fff',
                                }}
                            >
                                Reset
                            </Button>
                        </Space>
                    </div>

                    {/* ACTIVE FILTERS */}
                    <div style={{ marginTop: 16 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                            Active Filters:
                        </span>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Tag
                                style={{
                                    background: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    color: '#3b82f6',
                                }}
                            >
                                {dateRange[0].format('DD/MM/YYYY')} - {dateRange[1].format('DD/MM/YYYY')}
                            </Tag>
                            <Tag
                                style={{
                                    background: 'rgba(230, 57, 70, 0.2)',
                                    border: '1px solid rgba(230, 57, 70, 0.3)',
                                    color: '#e63946',
                                }}
                            >
                                Top {limit} Movies
                            </Tag>
                        </div>
                    </div>
                </Card>

                {/* DATA TABLE */}
                <Card
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                    }}
                >
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <Spin size="large" tip="Loading top movies..." />
                        </div>
                    ) : movies.length === 0 ? (
                        <Empty
                            description="No movies found"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                        />
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={movies.map((movie, index) => ({
                                ...movie,
                                key: movie.movieId,
                                rank: index + 1,
                            }))}
                            pagination={false}
                            scroll={{ x: 1200 }}
                            style={{
                                background: '#111',
                            }}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default TopMoviesPage;